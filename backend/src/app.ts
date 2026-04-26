import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes     from './modules/auth/auth.routes';
import profileRoutes  from './modules/profile/profile.routes';
import listsRoutes    from './modules/lists/lists.routes';
import settingsRoutes from './modules/settings/settings.routes';
import movieRoutes    from './modules/movies/movie.routes';
import tmdbRoutes     from './modules/tmdb/tmdb.routes';
import followsRoutes  from './modules/follows/follows.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 1 * 1000,   
  max: 30,               
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

export default app;