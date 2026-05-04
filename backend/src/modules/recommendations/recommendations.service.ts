import pool from '../../config/database';
import { fetchFromTMDB } from '../tmdb/tmdb.service';
import { callGemini, getModelName } from './gemini.service';
import {
  WatchedMovieForPrompt,
  AiRecommendationItem,
  AiRecommendationsResponse,
  GeminiRawResponse,
} from './recommendations.types';

const CACHE_TTL_HOURS = 24;
const MAX_WATCHED_IN_PROMPT = 75;        
const OVERGENERATE_COUNT = 25;            
const TARGET_RECOMMENDATIONS = 15;        
const MIN_ACCEPTABLE = 5;                 
const MAX_RETRY_ROUNDS = 1;             

// 1. Збір watched-списку для користувача

export const getAllWatchedMovies = async (
  userId: number
): Promise<WatchedMovieForPrompt[]> => {
  const result = await pool.query(
    `
    SELECT
      uma.tmdb_id,
      uma.is_favorite,
      uma.is_disliked,
      uma.updated_at,
      udr.overall_rating,
      tmc.title AS cached_title
    FROM user_movie_actions uma
    LEFT JOIN user_detailed_ratings udr
      ON udr.user_id = uma.user_id AND udr.tmdb_id = uma.tmdb_id
    LEFT JOIN tmdb_media_cache tmc
      ON tmc.tmdb_id = uma.tmdb_id AND tmc.media_type = 'movie'
    WHERE uma.user_id = $1 AND uma.is_watched = TRUE
    ORDER BY uma.updated_at DESC
    `,
    [userId]
  );

  const movies: Array<WatchedMovieForPrompt & { _updatedAt: Date }> = [];
  for (const row of result.rows) {
    let title: string | null = row.cached_title;
    if (!title) {
      try {
        const data = await fetchFromTMDB<{ title?: string }>(`/movie/${row.tmdb_id}`);
        title = data.title || null;
      } catch {
        title = null;
      }
    }
    if (!title) continue;

    movies.push({
      title,
      rating: row.overall_rating !== null ? Number(row.overall_rating) : null,
      is_favorite: !!row.is_favorite,
      is_disliked: !!row.is_disliked,
      _updatedAt: row.updated_at,
    });
  }

  return movies;
};


export const selectWatchedForPrompt = (
  all: Array<WatchedMovieForPrompt & { _updatedAt?: Date }>
): WatchedMovieForPrompt[] => {
  // Якщо влазимо - беремо все
  if (all.length <= MAX_WATCHED_IN_PROMPT) {
    return all.map(stripInternalFields);
  }

  const seen = new Set<string>(); // dedup за назвою
  const selected: typeof all = [];

  const addUnique = (movie: typeof all[number]) => {
    if (seen.has(movie.title)) return;
    if (selected.length >= MAX_WATCHED_IN_PROMPT) return;
    seen.add(movie.title);
    selected.push(movie);
  };

  // 1 Усі favorite (отримують найвищий пріоритет)
  for (const m of all) {
    if (m.is_favorite) addUnique(m);
  }

  // 2 Усі disliked
  for (const m of all) {
    if (m.is_disliked) addUnique(m);
  }

  // 3. Топ за рейтингом (rating >= 7), сортовані за спаданням
  const ratedHigh = all
    .filter((m) => m.rating !== null && m.rating >= 7 && !m.is_favorite && !m.is_disliked)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  for (const m of ratedHigh) addUnique(m);

  // 4. Решта рейтингованих (середні оцінки) 
  const ratedRest = all
    .filter((m) => m.rating !== null && m.rating < 7 && !m.is_favorite && !m.is_disliked)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  for (const m of ratedRest) addUnique(m);

  // 5 Найсвіжіші watched-without-rating
  const unrated = all
    .filter((m) => m.rating === null && !m.is_favorite && !m.is_disliked)
    .sort((a, b) => {
      const da = a._updatedAt?.getTime() ?? 0;
      const db = b._updatedAt?.getTime() ?? 0;
      return db - da;
    });
  for (const m of unrated) addUnique(m);

  return selected.map(stripInternalFields);
};

const stripInternalFields = (
  m: WatchedMovieForPrompt & { _updatedAt?: Date }
): WatchedMovieForPrompt => ({
  title: m.title,
  rating: m.rating,
  is_favorite: m.is_favorite,
  is_disliked: m.is_disliked,
});


export const getExcludedTmdbIds = async (userId: number): Promise<Set<number>> => {
  const result = await pool.query(
    `SELECT DISTINCT tmdb_id FROM user_movie_actions
     WHERE user_id = $1 AND (is_watched = TRUE OR is_disliked = TRUE)`,
    [userId]
  );
  return new Set(result.rows.map((r) => Number(r.tmdb_id)));
};

// 2. Формування промту

const formatMovieLine = (m: WatchedMovieForPrompt): string => {
  const parts: string[] = [`"${m.title}"`];
  if (m.rating !== null) parts.push(`rating ${m.rating}/10`);
  if (m.is_favorite) parts.push('favorite ❤');
  if (m.is_disliked) parts.push('disliked 👎');
  return `- ${parts.join(' | ')}`;
};

export const buildPrompt = (
  watched: WatchedMovieForPrompt[],
  totalWatchedCount: number,
  excludeFromPreviousRound: string[] = []
): string => {
  const watchedBlock = watched.length
    ? watched.map(formatMovieLine).join('\n')
    : '(no watched movies yet)';

  const samplingNote =
    totalWatchedCount > watched.length
      ? `\n\nNOTE: The user has watched ${totalWatchedCount} movies in total. ` +
        `This list shows the ${watched.length} most representative ones, ` +
        `prioritizing favorites, dislikes, and highly-rated titles.`
      : '';

  const excludeBlock = excludeFromPreviousRound.length
    ? `\n\nDO NOT recommend these (already suggested and filtered out):\n${excludeFromPreviousRound
        .map((t) => `- "${t}"`)
        .join('\n')}`
    : '';

  return `You are MovieCrush, a film recommendation expert for a mobile app.

Your task: analyze the user's taste profile based on their watched movies and recommend exactly ${OVERGENERATE_COUNT} movies they have NOT watched yet.

═══════════════════════════════════════════════
STEP 1 — Analyze the user's taste signals
═══════════════════════════════════════════════
Before recommending, think step by step:

1.1 Extract patterns from the watched list:
- Which genres appear most frequently?
- Which movies are rated highest (8-10/10) and which are favorites? Those are the strongest taste signals.
- Which movies are disliked? Avoid anything stylistically similar to those.
- Which decades / countries / directors / actors appear repeatedly in highly-rated movies?

1.2 Identify gaps and opportunities:
- Which genres are missing but would plausibly fit?
- What unusual common threads run through the favorites?

1.3 Formalize taste signature internally (do not output it):
A 1-2 sentence summary of this user's cinematic identity.

═══════════════════════════════════════════════
USER PROFILE — Watched movies
═══════════════════════════════════════════════
Movies in this prompt: ${watched.length}${samplingNote}

Each movie shows: title | rating (1-10, if user rated it) | favorite/disliked flags.
Movies without a rating are simply marked as watched.

${watchedBlock}${excludeBlock}

═══════════════════════════════════════════════
STEP 2 — Recommend ${OVERGENERATE_COUNT} movies the user has NOT watched
═══════════════════════════════════════════════

We over-generate ${OVERGENERATE_COUNT} candidates so the backend can filter out any the user already watched.
Aim for breadth and quality — every recommendation should be defensible.

Composition guidance (approximate):
- ~${Math.round(OVERGENERATE_COUNT * 0.65)} → strong_match (closely match the user's taste signature)
- ~${Math.round(OVERGENERATE_COUNT * 0.20)} → diversity (different but plausibly enjoyable — prevents echo chamber)
- ~${Math.round(OVERGENERATE_COUNT * 0.15)} → hidden_gem (lesser-known or international cinema)

Constraints:
- DO NOT include any movie from the watched list above.
- DO NOT include any movie marked as disliked.
- No duplicate recommendations.
- Year range: 1960-2026 (unless the user shows strong decade preference).
- Each movie must be REAL and verifiable (correct title + correct year).
- Reasoning must reference SPECIFIC signals from this user's data.

═══════════════════════════════════════════════
OUTPUT FORMAT — STRICT JSON ONLY
═══════════════════════════════════════════════

Respond with ONLY valid JSON. No markdown. No code fences. No commentary.
Start with { and end with }.

{
  "recommendations": [
    {
      "title": "Movie Title",
      "year": 2024,
      "category": "strong_match",
      "reasoning": "why this fits THIS specific user (max 30 words, reference their data)",
      "why_this_will_work": "which exact user signal triggered this (max 20 words)"
    }
  ]
}`;
};

// 3. Матчінг рекомендацій з TMDB

interface TmdbSearchResult {
  results: Array<{
    id: number;
    title: string;
    release_date?: string;
    poster_path?: string | null;
    vote_average?: number;
    overview?: string;
  }>;
}

const matchOnTmdb = async (
  title: string,
  year: number
): Promise<{
  tmdb_id: number;
  poster_path: string | null;
  vote_average: number;
  overview: string;
} | null> => {
  try {
    const data = await fetchFromTMDB<TmdbSearchResult>('/search/movie', {
      query: title,
      year: year,
    });

    if (!data.results || data.results.length === 0) {
      const fallback = await fetchFromTMDB<TmdbSearchResult>('/search/movie', {
        query: title,
      });
      if (!fallback.results || fallback.results.length === 0) return null;

      const best = fallback.results
        .filter((r) => r.release_date)
        .sort((a, b) => {
          const ya = parseInt(a.release_date!.slice(0, 4), 10);
          const yb = parseInt(b.release_date!.slice(0, 4), 10);
          return Math.abs(ya - year) - Math.abs(yb - year);
        })[0];

      if (!best) return null;
      return {
        tmdb_id: best.id,
        poster_path: best.poster_path ?? null,
        vote_average: best.vote_average ?? 0,
        overview: best.overview ?? '',
      };
    }

    const top = data.results[0];
    return {
      tmdb_id: top.id,
      poster_path: top.poster_path ?? null,
      vote_average: top.vote_average ?? 0,
      overview: top.overview ?? '',
    };
  } catch (err) {
    console.error(`TMDB match failed for "${title}" (${year}):`, err);
    return null;
  }
};

// 4) Збагачення + фільтрація

const enrichAndFilter = async (
  raw: GeminiRawResponse,
  excludedTmdbIds: Set<number>,
  alreadyKept: AiRecommendationItem[]
): Promise<{
  kept: AiRecommendationItem[];
  rejectedTitles: string[];
}> => {
  const kept: AiRecommendationItem[] = [...alreadyKept];
  const keptIds = new Set(kept.map((k) => k.tmdb_id).filter(Boolean) as number[]);
  const rejectedTitles: string[] = [];

  for (const rec of raw.recommendations) {
    const match = await matchOnTmdb(rec.title, rec.year);

    if (!match) {
      rejectedTitles.push(rec.title);
      continue;
    }
    if (excludedTmdbIds.has(match.tmdb_id)) {
      rejectedTitles.push(rec.title);
      continue;
    }
    if (keptIds.has(match.tmdb_id)) continue; // dedup

    keptIds.add(match.tmdb_id);
    kept.push({
      title: rec.title,
      year: rec.year,
      category: rec.category,
      reasoning: rec.reasoning,
      why_this_will_work: rec.why_this_will_work,
      tmdb_id: match.tmdb_id,
      media_type: 'movie',
      poster_path: match.poster_path,
      vote_average: match.vote_average,
      overview: match.overview,
    });
  }

  return { kept, rejectedTitles };
};

// 5 Кеш

interface CachedRow {
  recommendations: AiRecommendationItem[];
  model_used: string;
  watched_count: number;
  created_at: Date;
  expires_at: Date;
}

const getCachedRecommendations = async (userId: number): Promise<CachedRow | null> => {
  const result = await pool.query(
    `SELECT recommendations, model_used, watched_count, created_at, expires_at
     FROM user_ai_recommendations
     WHERE user_id = $1 AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    recommendations: row.recommendations,
    model_used: row.model_used,
    watched_count: Number(row.watched_count),
    created_at: row.created_at,
    expires_at: row.expires_at,
  };
};

const saveRecommendationsToCache = async (
  userId: number,
  recommendations: AiRecommendationItem[],
  modelUsed: string,
  watchedCount: number
): Promise<void> => {
  await pool.query(`DELETE FROM user_ai_recommendations WHERE user_id = $1`, [userId]);
  await pool.query(
    `INSERT INTO user_ai_recommendations
       (user_id, recommendations, model_used, watched_count, expires_at)
     VALUES ($1, $2, $3, $4, NOW() + INTERVAL '${CACHE_TTL_HOURS} hours')`,
    [userId, JSON.stringify(recommendations), modelUsed, watchedCount]
  );
};

// 6) Public entry-point

export const getAiRecommendationsForUser = async (
  userId: number,
  forceRefresh = false
): Promise<AiRecommendationsResponse> => {
  if (!forceRefresh) {
    const cached = await getCachedRecommendations(userId);
    if (cached) {
      return {
        recommendations: cached.recommendations,
        model_used: cached.model_used,
        watched_count: cached.watched_count,
        cached: true,
        computed_at: cached.created_at.toISOString(),
      };
    }
  }

  const allWatched = await getAllWatchedMovies(userId);

  if (allWatched.length === 0) {
    throw new Error(
      'No watched movies yet. Mark some movies as watched first to get personalized AI recommendations.'
    );
  }

  const sampledWatched = selectWatchedForPrompt(allWatched);
  console.log(
    `[AI Recs] User ${userId}: ${allWatched.length} total watched, ` +
      `${sampledWatched.length} selected for prompt`
  );

  const excluded = await getExcludedTmdbIds(userId);

  let kept: AiRecommendationItem[] = [];
  let rejectedTitles: string[] = [];

  const firstPrompt = buildPrompt(sampledWatched, allWatched.length);
  const firstRaw = await callGemini(firstPrompt);
  const firstResult = await enrichAndFilter(firstRaw, excluded, kept);
  kept = firstResult.kept;
  rejectedTitles = firstResult.rejectedTitles;

  console.log(
    `[AI Recs] First round: requested ${OVERGENERATE_COUNT}, ` +
      `got ${firstRaw.recommendations.length}, kept ${kept.length} after filtering`
  );

  if (kept.length < MIN_ACCEPTABLE) {
    console.warn(
      `[AI Recs] Only ${kept.length} usable recs (< ${MIN_ACCEPTABLE}). Regenerating once.`
    );

    for (let retry = 0; retry < MAX_RETRY_ROUNDS; retry += 1) {
      const retryPrompt = buildPrompt(sampledWatched, allWatched.length, [
        ...rejectedTitles,
        ...kept.map((k) => k.title),
      ]);
      try {
        const retryRaw = await callGemini(retryPrompt);
        const retryResult = await enrichAndFilter(retryRaw, excluded, kept);
        kept = retryResult.kept;
        rejectedTitles = [...rejectedTitles, ...retryResult.rejectedTitles];

        console.log(
          `[AI Recs] Retry ${retry + 1}: kept ${kept.length} after filtering`
        );

        if (kept.length >= MIN_ACCEPTABLE) break;
      } catch (err) {
        console.error(`[AI Recs] Retry round ${retry + 1} failed:`, err);
        break;
      }
    }
  }

  kept = kept.slice(0, TARGET_RECOMMENDATIONS);

  if (kept.length === 0) {
    throw new Error('Could not produce any valid recommendations. Try again later.');
  }

  const modelUsed = getModelName();
  await saveRecommendationsToCache(userId, kept, modelUsed, allWatched.length);

  return {
    recommendations: kept,
    model_used: modelUsed,
    watched_count: allWatched.length,
    cached: false,
    computed_at: new Date().toISOString(),
  };
};