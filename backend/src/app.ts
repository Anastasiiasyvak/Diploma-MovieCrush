import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import userRoutes from './modules/user/user.routes';
import profileRoutes from './modules/user/profile.routes';

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

app.use('/api/auth', userRoutes);
app.use('/api/profile', profileRoutes);

export default app;