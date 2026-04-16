import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './modules/auth/auth.routes';
import profileRoutes from './modules/profile/profile.routes';
import listsRoutes from './modules/lists/lists.routes';
import settingsRoutes from './modules/settings/settings.routes';
import movieRoutes from './modules/movies/movie.routes'; // 🆕

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 10 * 1000,
  max: 40,
  message: { error: 'Too many requests, please try again later' },
});

app.use('/api/', limiter);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'MovieCrush API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/lists', listsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/movies', movieRoutes); 

export default app;