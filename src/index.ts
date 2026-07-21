import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './utils/errors.js';
import { connectDatabase } from './db/connect.js';
import { seedDatabaseIfEmpty } from './db/seed.js';

async function bootstrap() {
  await connectDatabase();
  await seedDatabaseIfEmpty();

  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use('/api', routes);
  app.use(errorHandler);

  app.listen(config.port, () => {
    console.log(`Edarah AI API listening on http://localhost:${config.port}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
