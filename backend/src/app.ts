import cors from 'cors';
import express from 'express';
import analyticsRouter from './routes/analytics.routes';
import assetRouter from './routes/assets.routes';
import portfolioRouter from './routes/portfolios.routes';

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    }),
  );
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(portfolioRouter);
  app.use(analyticsRouter);
  app.use(assetRouter);

  return app;
};
