import PgBoss from 'pg-boss';
import { env } from '../config/env';

let boss: PgBoss | null = null;

export function getBoss() {
  if (!boss) throw new Error('pg-boss not initialized');
  return boss;
}

export async function initBoss() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required for pg-boss');

  boss = new PgBoss({
    connectionString,
    schema: env.boss.schema,
    monitorStateIntervalSeconds: Math.floor(env.boss.monitorInterval / 1000),
  });

  await boss.start();

  // Example job subscription
  await boss.work('email:send', async (job) => {
    // Implement email sending
    console.log('Sending email', job.data);
  });

  console.log('pg-boss started');
}

export async function stopBoss() {
  if (boss) {
    await boss.stop();
    boss = null;
  }
}
