import { Request, Response } from 'express';
import { fetchFromTMDB } from './tmdb.service';

// тут обробник помилок проксі
const handleError = (res: Response, err: unknown, context: string) => {
  console.error(`TMDB proxy error (${context}):`, err);
  res.status(502).json({ error: 'Failed to fetch from TMDB' });
};


export const getTrendingMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    const { timeWindow } = req.params;
    const data = await fetchFromTMDB(`/trending/movie/${timeWindow}`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getTrendingMovies'); }
};

export const getTrendingSeries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { timeWindow } = req.params;
    const data = await fetchFromTMDB(`/trending/tv/${timeWindow}`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getTrendingSeries'); }
};


export const getTopRatedMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = req.query.page as string | undefined;
    const data = await fetchFromTMDB('/movie/top_rated', { page });
    res.json(data);
  } catch (err) { handleError(res, err, 'getTopRatedMovies'); }
};

export const getUpcomingMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = req.query.page as string | undefined;
    const data = await fetchFromTMDB('/movie/upcoming', { page });
    res.json(data);
  } catch (err) { handleError(res, err, 'getUpcomingMovies'); }
};

export const getMovieDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchFromTMDB(`/movie/${req.params.id}`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getMovieDetails'); }
};

export const getMovieCredits = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchFromTMDB(`/movie/${req.params.id}/credits`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getMovieCredits'); }
};

export const getMovieImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchFromTMDB(`/movie/${req.params.id}/images`, {
      include_image_language: 'en,null',
    });
    res.json(data);
  } catch (err) { handleError(res, err, 'getMovieImages'); }
};

export const getMovieVideos = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchFromTMDB(`/movie/${req.params.id}/videos`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getMovieVideos'); }
};

export const getSimilarMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchFromTMDB(`/movie/${req.params.id}/similar`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getSimilarMovies'); }
};

export const getMovieRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchFromTMDB(`/movie/${req.params.id}/recommendations`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getMovieRecommendations'); }
};

export const getMovieExternalIds = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchFromTMDB(`/movie/${req.params.id}/external_ids`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getMovieExternalIds'); }
};


export const getTopRatedSeries = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = req.query.page as string | undefined;
    const data = await fetchFromTMDB('/tv/top_rated', { page });
    res.json(data);
  } catch (err) { handleError(res, err, 'getTopRatedSeries'); }
};

export const getSeriesDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchFromTMDB(`/tv/${req.params.id}`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getSeriesDetails'); }
};

export const getSeriesCredits = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchFromTMDB(`/tv/${req.params.id}/credits`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getSeriesCredits'); }
};

export const getSeriesImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchFromTMDB(`/tv/${req.params.id}/images`, {
      include_image_language: 'en,null',
    });
    res.json(data);
  } catch (err) { handleError(res, err, 'getSeriesImages'); }
};

export const getSeriesVideos = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchFromTMDB(`/tv/${req.params.id}/videos`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getSeriesVideos'); }
};

export const getSimilarSeries = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchFromTMDB(`/tv/${req.params.id}/similar`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getSimilarSeries'); }
};

export const getSeasonDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, seasonNumber } = req.params;
    const data = await fetchFromTMDB(`/tv/${id}/season/${seasonNumber}`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getSeasonDetail'); }
};

export const getEpisodeDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, seasonNumber, episodeNumber } = req.params;
    const data = await fetchFromTMDB(
      `/tv/${id}/season/${seasonNumber}/episode/${episodeNumber}`,
    );
    res.json(data);
  } catch (err) { handleError(res, err, 'getEpisodeDetail'); }
};


export const searchMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.query as string | undefined;
    const page = req.query.page as string | undefined;
    if (!query) { res.status(400).json({ error: 'query is required' }); return; }
    const data = await fetchFromTMDB('/search/movie', { query, page });
    res.json(data);
  } catch (err) { handleError(res, err, 'searchMovies'); }
};

export const searchSeries = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.query as string | undefined;
    const page = req.query.page as string | undefined;
    if (!query) { res.status(400).json({ error: 'query is required' }); return; }
    const data = await fetchFromTMDB('/search/tv', { query, page });
    res.json(data);
  } catch (err) { handleError(res, err, 'searchSeries'); }
};

export const searchPeople = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.query as string | undefined;
    const page = req.query.page as string | undefined;
    if (!query) { res.status(400).json({ error: 'query is required' }); return; }
    const data = await fetchFromTMDB('/search/person', { query, page });
    res.json(data);
  } catch (err) { handleError(res, err, 'searchPeople'); }
};


export const discoverMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    const params = req.query as Record<string, string>;
    const data = await fetchFromTMDB('/discover/movie', params);
    res.json(data);
  } catch (err) { handleError(res, err, 'discoverMovies'); }
};

export const discoverSeries = async (req: Request, res: Response): Promise<void> => {
  try {
    const params = req.query as Record<string, string>;
    const data = await fetchFromTMDB('/discover/tv', params);
    res.json(data);
  } catch (err) { handleError(res, err, 'discoverSeries'); }
};


export const getPersonDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchFromTMDB(`/person/${req.params.id}`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getPersonDetails'); }
};

export const getPersonCombinedCredits = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchFromTMDB(`/person/${req.params.id}/combined_credits`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getPersonCombinedCredits'); }
};