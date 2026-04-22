import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import * as ctrl from './tmdb.controller';

const router = Router();

// Усі TMDB-проксі доступні лише залогіненим юзерам 
// так ми не даємо стороннім юзати наш сервер як безкоштовний проксі до TMDB
router.use(authMiddleware);

router.get('/trending/movie/:timeWindow', ctrl.getTrendingMovies);
router.get('/trending/tv/:timeWindow', ctrl.getTrendingSeries);

router.get('/search/movie', ctrl.searchMovies);
router.get('/search/tv', ctrl.searchSeries);
router.get('/search/person', ctrl.searchPeople);

router.get('/discover/movie', ctrl.discoverMovies);
router.get('/discover/tv', ctrl.discoverSeries);

router.get('/person/:id', ctrl.getPersonDetails);
router.get('/person/:id/combined_credits', ctrl.getPersonCombinedCredits);

router.get('/movie/top_rated', ctrl.getTopRatedMovies);
router.get('/movie/upcoming', ctrl.getUpcomingMovies);
router.get('/movie/:id', ctrl.getMovieDetails);
router.get('/movie/:id/credits', ctrl.getMovieCredits);
router.get('/movie/:id/images', ctrl.getMovieImages);
router.get('/movie/:id/videos', ctrl.getMovieVideos);
router.get('/movie/:id/similar', ctrl.getSimilarMovies);
router.get('/movie/:id/recommendations', ctrl.getMovieRecommendations);
router.get('/movie/:id/external_ids', ctrl.getMovieExternalIds);

router.get('/tv/top_rated', ctrl.getTopRatedSeries);
router.get('/tv/:id', ctrl.getSeriesDetails);
router.get('/tv/:id/credits', ctrl.getSeriesCredits);
router.get('/tv/:id/images', ctrl.getSeriesImages);
router.get('/tv/:id/videos', ctrl.getSeriesVideos);
router.get('/tv/:id/similar', ctrl.getSimilarSeries);
router.get('/tv/:id/season/:seasonNumber', ctrl.getSeasonDetail);
router.get('/tv/:id/season/:seasonNumber/episode/:episodeNumber', ctrl.getEpisodeDetail);

export default router;