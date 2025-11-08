import { createApp } from './app';
import { env } from './config/env';
import { initBoss } from './jobs/boss';
import { prisma } from './lib/prisma';

async function bootstrap() {
  const app = createApp();

  // Verify database connectivity early
  await prisma.$queryRaw`SELECT 1`;

  // Initialize pg-boss
  await initBoss();

  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal startup error', err);
  process.exit(1);
});
