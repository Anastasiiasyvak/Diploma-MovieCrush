import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './modules/auth/auth.routes';
import profileRoutes from './modules/profile/profile.routes';
import listsRoutes from './modules/lists/lists.routes';
import settingsRoutes from './modules/settings/settings.routes';
import movieRoutes from './modules/movies/movie.routes';
import tmdbRoutes from './modules/tmdb/tmdb.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

// я змінила трошки цей лімітер, бо я прочитала що tmdb відмінили старий ліміт 40/10с ще давно, а зараз 40/1с на IP, тому я поставила 100/10с, 
// щоб не перевищувати цей ліміт, і щоб юзери могли спокійно відкривати екрани з паралельними запитами
const limiter = rateLimit({
  windowMs: 10 * 1000,
  max: 100,
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

export default app;