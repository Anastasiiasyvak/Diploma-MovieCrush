import pool from '../../config/database';
import { fetchFromTMDB } from '../tmdb/tmdb.service';
import { callGemini, getModelName } from './gemini.service';
import { PersonalizedItem, PersonalizedResponse, TaggedItem } from './als_service';
import { WatchedMovieForPrompt } from './recommendations.types';
import { MediaType } from '../shared/user.types';
import logger from '../../config/logger';

const CACHE_TTL_HOURS = 24;
const WATCHED_SAMPLE_SIZE = 10;  
const MIN_ACCEPTABLE = 5;

interface WatchedRow extends WatchedMovieForPrompt {
  media_type: MediaType;
  _updatedAt: Date;
}

const resolveTitleFromTmdb = async (
  tmdbId: number,
): Promise<{ title: string; media_type: MediaType } | null> => {
  try {
    const movie = await fetchFromTMDB<{ title?: string }>(`/movie/${tmdbId}`);
    if (movie.title) return { title: movie.title, media_type: 'movie' };
  } catch {
  }
  try {
    const tv = await fetchFromTMDB<{ name?: string }>(`/tv/${tmdbId}`);
    if (tv.name) return { title: tv.name, media_type: 'tv' };
  } catch {
  }
  return null;
};

export const getAllWatchedMovies = async (userId: number): Promise<WatchedRow[]> => {
  const result = await pool.query(
    `SELECT
       uma.tmdb_id,
       uma.is_favorite,
       uma.is_disliked,
       uma.updated_at,
       udr.overall_rating,
       tmc.title       AS cached_title,
       tmc.media_type  AS cached_media_type
     FROM user_movie_actions uma
     LEFT JOIN user_detailed_ratings udr
       ON udr.user_id = uma.user_id AND udr.tmdb_id = uma.tmdb_id
     LEFT JOIN tmdb_media_cache tmc
       ON tmc.tmdb_id = uma.tmdb_id
     WHERE uma.user_id = $1 AND uma.is_watched = TRUE
     ORDER BY uma.updated_at DESC`,
    [userId]
  );

  const movies: WatchedRow[] = [];
  const needsFetch: typeof result.rows = [];

  for (const row of result.rows) {
    if (row.cached_title) {
      movies.push({
        title: row.cached_title,
        media_type: row.cached_media_type === 'tv' ? 'tv' : 'movie',
        rating: row.overall_rating !== null ? Number(row.overall_rating) : null,
        is_favorite: !!row.is_favorite,
        is_disliked: !!row.is_disliked,
        _updatedAt: row.updated_at,
      });
    } else {
      needsFetch.push(row);
    }
  }

  const fetched = await Promise.all(
    needsFetch.map(row => resolveTitleFromTmdb(row.tmdb_id))
  );

  for (let i = 0; i < needsFetch.length; i++) {
    const resolved = fetched[i];
    if (!resolved) continue;
    const row = needsFetch[i];
    movies.push({
      title: resolved.title,
      media_type: resolved.media_type,
      rating: row.overall_rating !== null ? Number(row.overall_rating) : null,
      is_favorite: !!row.is_favorite,
      is_disliked: !!row.is_disliked,
      _updatedAt: row.updated_at,
    });
  }

  movies.sort((a, b) => b._updatedAt.getTime() - a._updatedAt.getTime());

  return movies;
};

export const selectWatchedForRerank = (
  all: WatchedRow[],
): WatchedMovieForPrompt[] => {
  if (all.length === 0) return [];

  const selected: WatchedRow[] = [];
  const seen = new Set<string>();

  const addUnique = (m: WatchedRow): boolean => {
    if (seen.has(m.title) || selected.length >= WATCHED_SAMPLE_SIZE) return false;
    seen.add(m.title);
    selected.push(m);
    return true;
  };

  for (let rating = 10; rating >= 1; rating--) {
    const byRating = all
      .filter(m => m.rating === rating)
      .sort((a, b) => b._updatedAt.getTime() - a._updatedAt.getTime());
    if (byRating.length > 0) addUnique(byRating[0]);
    if (selected.length >= WATCHED_SAMPLE_SIZE) break;
  }

  const byRecent = [...all].sort((a, b) => b._updatedAt.getTime() - a._updatedAt.getTime());
  for (const m of byRecent) {
    if (selected.length >= WATCHED_SAMPLE_SIZE) break;
    addUnique(m);
  }

  return selected.map(({ title, rating, is_favorite, is_disliked }) => ({
    title, rating, is_favorite, is_disliked,
  }));
};


const buildRerankPrompt = (
  candidates: TaggedItem[],
  watched: WatchedMovieForPrompt[],
  totalWatchedCount: number,
): string => {
  const watchedBlock = watched.length
    ? watched.map(m => {
        const parts = [`"${m.title}"`];
        if (m.rating !== null) parts.push(`${m.rating}/10`);
        if (m.is_favorite) parts.push('fav');
        if (m.is_disliked) parts.push('disliked');
        return `- ${parts.join(' | ')}`;
      }).join('\n')
    : '(no rated movies yet)';

  const samplingNote = totalWatchedCount > watched.length
    ? `\nShowing ${watched.length} strongest signals out of ${totalWatchedCount} total watched.`
    : '';

  const candidatesBlock = candidates
    .map((c, i) =>
      `${i + 1}. [${c.source.toUpperCase()}] id:${c.tmdb_id} | "${c.title}" | ${c.media_type === 'tv' ? 'series' : 'movie'} | ${c.vote_average.toFixed(1)}`
    )
    .join('\n');

  return `You are MovieCrush - a senior film & TV taste expert inside a movie tracking app.

Your job: from the candidate list below, pick exactly 15 titles (movies or series) that will feel most rewarding for this specific user.
If the candidate pool has fewer than 15 items, return all of them.
Only return fewer than 15 if you genuinely cannot find more good matches - minimum 5.

WHAT THIS USER WATCHES & RATES
${watchedBlock}${samplingNote}

CANDIDATE POOL — ${candidates.length} titles
${candidatesBlock}

[ALS] = recommended by collaborative filtering (users with similar taste rated these highly)
[DISCOVER] = matched by this user's most-watched genres and favorite actor

SELECTION RULES

1. Target 15 results. Return all candidates if pool ≤ 15.
2. Use each tmdb_id EXACTLY as listed - never invent or modify ids.
3. Skip anything stylistically close to a disliked title.
4. Keep genre diversity - no more than 8 titles from the same genre.
5. Prioritise [ALS] titles; use [DISCOVER] to fill diversity gaps.
6. Assign every title one category:
   • strong_match  - clearly fits the user's established taste
   • diversity - different from usual but plausibly enjoyable
   • hidden_gem - lesser-known or underrated pick worth discovering
7. Target composition: ~60 % strong_match · ~25 % diversity · ~15 % hidden_gem

OUTPUT FORMAT

Respond with VALID JSON ONLY. No markdown fences, no keys outside the object.
{"recommendations":[{"tmdb_id":123,"category":"strong_match"}]}`;
};


interface CachedRow {
  recommendations: PersonalizedItem[];
  model_used: string;
  watched_count: number;
  created_at: Date;
  expires_at: Date;
}

const getCachedPersonalized = async (userId: number): Promise<CachedRow | null> => {
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

const savePersonalizedToCache = async (
  userId: number,
  recommendations: PersonalizedItem[],
  modelUsed: string,
  watchedCount: number,
): Promise<void> => {
  await pool.query(`DELETE FROM user_ai_recommendations WHERE user_id = $1`, [userId]);
  await pool.query(
    `INSERT INTO user_ai_recommendations
       (user_id, recommendations, model_used, watched_count, expires_at)
     VALUES ($1, $2, $3, $4, NOW() + ($5 || ' hours')::interval)`,
    [userId, JSON.stringify(recommendations), modelUsed, watchedCount, String(CACHE_TTL_HOURS)]
  );
};


interface GeminiRerankResponse {
  recommendations: Array<{
    tmdb_id: number;
    category: 'strong_match' | 'diversity' | 'hidden_gem';
  }>;
}

export const rerankWithGemini = async (
  userId: number,
  candidates: TaggedItem[],
  watchedCount: number,
): Promise<PersonalizedResponse> => {
  const cached = await getCachedPersonalized(userId);
  if (cached) {
    logger.debug(`[Rerank] Cache hit for user ${userId} (expires: ${cached.expires_at.toISOString()})`);
    return {
      recommendations: cached.recommendations,
      strategy: 'personalized',
      watched_count: cached.watched_count,
      cached: true,
      computed_at: cached.created_at.toISOString(),
      model_used: cached.model_used,
    };
  }

  if (candidates.length === 0) {
    throw new Error('No candidates to rerank');
  }

  const allWatched = await getAllWatchedMovies(userId);
  const watchedSample = selectWatchedForRerank(allWatched);

  logger.debug(`[Rerank] User ${userId} | candidates: ${candidates.length} | watched sample: ${watchedSample.length}/${allWatched.length}`);

  const alsItems = candidates.filter(c => c.source === 'als');
  const discoverItems = candidates.filter(c => c.source === 'discover');

  logger.debug(`\n[Rerank] ALS candidates (${alsItems.length}):`);
  for (const c of alsItems) {
    logger.debug(`  [ALS] tmdb_id:${c.tmdb_id} | "${c.title}" | ${c.vote_average.toFixed(1)} | ${c.media_type}`);
  }

  logger.debug(`\n[Rerank] Discover candidates (${discoverItems.length}):`);
  for (const c of discoverItems) {
    logger.debug(`  [DISC] tmdb_id:${c.tmdb_id} | "${c.title}" | ${c.vote_average.toFixed(1)} | ${c.media_type}`);
  }

  logger.debug(`\n[Rerank] Watched sample for context (${watchedSample.length}/${allWatched.length} total):`);
  for (const m of watchedSample) {
    const parts: string[] = [];
    if (m.rating !== null) parts.push(`${m.rating}/10`);
    if (m.is_favorite) parts.push('fav');
    if (m.is_disliked) parts.push('disliked');
    logger.debug(`  "${m.title}"${parts.length ? ' | ' + parts.join(' | ') : ''}`);
  }

  const prompt = buildRerankPrompt(candidates, watchedSample, watchedCount);
  logger.debug(`\n[Rerank] Prompt length: ${prompt.length} chars → sending to Gemini...`);

  let rerankResult: GeminiRerankResponse;
  try {
    rerankResult = await callGemini(prompt) as unknown as GeminiRerankResponse;
  } catch (err) {
    logger.error({ err, userId }, '[Rerank] Gemini failed, using ALS-priority fallback');
    // Fallback: ALS в пріоритеті (вже відсортований за cf моделюю) Discover тільки добирає якщо ALS не вистачило до 25
    const alsCandidates = candidates.filter(c => c.source === 'als');
    const discoverCandidates = candidates.filter(c => c.source === 'discover');
    const fallbackPool = [...alsCandidates, ...discoverCandidates].slice(0, 15);
    logger.debug(`[Rerank] Fallback pool: ${alsCandidates.length} ALS + ${Math.max(0, 15 - alsCandidates.length)} Discover`);
    const fallback: PersonalizedItem[] = fallbackPool.map(c => ({
      tmdb_id: c.tmdb_id,
      media_type: c.media_type,
      title: c.title,
      poster_path: c.poster_path,
      vote_average: c.vote_average,
      overview: c.overview,
      release_date: c.release_date,
      category: 'strong_match' as const,
    }));
    return {
      recommendations: fallback,
      strategy: 'personalized',
      watched_count: watchedCount,
      cached: false,
      computed_at: new Date().toISOString(),
      model_used: 'fallback',
    };
  }

  const candidateMap = new Map(candidates.map(c => [c.tmdb_id, c]));
  const reranked: PersonalizedItem[] = [];

  logger.debug(`\n[Rerank] Gemini returned ${rerankResult.recommendations?.length ?? 0} items:`);

  const VALID_CATEGORIES = ['strong_match', 'diversity', 'hidden_gem'] as const;
  type Category = typeof VALID_CATEGORIES[number];
  const isValidCategory = (c: unknown): c is Category =>
    typeof c === 'string' && (VALID_CATEGORIES as readonly string[]).includes(c);

  const categoryCount: Record<Category, number> = { strong_match: 0, diversity: 0, hidden_gem: 0 };

  for (const rec of rerankResult.recommendations ?? []) {
    const candidate = candidateMap.get(rec.tmdb_id);
    if (!candidate) {
      logger.warn({ tmdbId: rec.tmdb_id }, 'Unknown tmdb_id in Gemini response, skipping');
      continue;
    }
    const cat: Category = isValidCategory(rec.category) ? rec.category : 'strong_match';
    categoryCount[cat] += 1;
    logger.debug(`  [${cat}] [${candidate.source.toUpperCase()}] tmdb_id:${rec.tmdb_id} "${candidate.title}"`);
    reranked.push({
      tmdb_id: candidate.tmdb_id,
      media_type: candidate.media_type,
      title: candidate.title,
      poster_path: candidate.poster_path,
      vote_average: candidate.vote_average,
      overview: candidate.overview,
      release_date: candidate.release_date,
      category: cat,
    });
  }

  logger.debug(`\n[Rerank] Categories: strong_match=${categoryCount.strong_match} diversity=${categoryCount.diversity} hidden_gem=${categoryCount.hidden_gem}`);

  // Fallback padding якщо дуже мало
  if (reranked.length < MIN_ACCEPTABLE) {
    logger.warn({ usable: reranked.length, min: MIN_ACCEPTABLE }, 'Too few rerank results, padding');
    const usedIds = new Set(reranked.map(r => r.tmdb_id));
    for (const c of candidates) {
      if (reranked.length >= 15) break;
      if (!usedIds.has(c.tmdb_id)) {
        logger.debug(`  + padding [${c.source.toUpperCase()}] tmdb_id:${c.tmdb_id} "${c.title}"`);
        reranked.push({
          tmdb_id: c.tmdb_id,
          media_type: c.media_type,
          title: c.title,
          poster_path: c.poster_path,
          vote_average: c.vote_average,
          overview: c.overview,
          release_date: c.release_date,
          category: 'strong_match',
        });
        usedIds.add(c.tmdb_id);
      }
    }
  }

  const modelUsed = getModelName();
  await savePersonalizedToCache(userId, reranked, modelUsed, watchedCount);

  logger.debug(`[Rerank] Final: ${reranked.length} recommendations saved to cache (TTL: ${CACHE_TTL_HOURS}h, table: user_ai_recommendations)`);

  return {
    recommendations: reranked,
    strategy: 'personalized',
    watched_count: watchedCount,
    cached: false,
    computed_at: new Date().toISOString(),
    model_used: modelUsed,
  };
};