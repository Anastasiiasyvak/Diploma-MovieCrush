import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import logger from './config/logger';

import authRoutes     from './modules/auth/auth.routes';
import profileRoutes  from './modules/profile/profile.routes';
import listsRoutes    from './modules/lists/lists.routes';
import settingsRoutes from './modules/settings/settings.routes';
import movieRoutes    from './modules/movies/movie.routes';
import tmdbRoutes     from './modules/tmdb/tmdb.routes';
import followsRoutes  from './modules/follows/follows.routes';
import soulmateRoutes from './modules/soulmate/soulmate.routes';
import recommendationsRoutes from './modules/recommendations/recommendations.routes';
import onboardingRoutes from './modules/onboarding/onboarding.routes';
import wrappedRoutes from './modules/wrapped/wrapped.routes';


const app = express();

app.set('trust proxy', 1);

app.use(pinoHttp({
  logger,
  serializers: {
    req(req) {
      return { id: req.id, method: req.method, url: req.url };
    },
    res(res) {
      return { statusCode: res.statusCode };
    },
  },
}));

app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ?.split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : true,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

app.use('/api/', limiter);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'MovieCrush API is running' });
});

app.use('/api/auth',     authRoutes);
app.use('/api/profile',  profileRoutes);
app.use('/api',          listsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api',          movieRoutes);
app.use('/api/tmdb',     tmdbRoutes);
app.use('/api/follows',  followsRoutes);
app.use('/api/soulmate', soulmateRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/wrapped', wrappedRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err, method: req.method, url: req.originalUrl }, 'Unhandled request error');
  res.status(500).json({ error: 'Internal server error' });
});

export default app;