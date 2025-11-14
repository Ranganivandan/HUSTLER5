import PgBoss from 'pg-boss';
import { config } from '../config';

// Use a broad type here to avoid tight coupling to pg-boss typings while preserving runtime behavior
let boss: any | null = null;

export function getBossInstance() {
  return boss;
}

export async function startWorker() {
  if (boss) return boss;
  boss = new PgBoss({
    connectionString: config.dbUrl,
    schema: config.boss.schema,
    monitorStateIntervalSeconds: Math.floor(config.boss.monitorInterval / 1000),
  } as any);

  await boss.start();

  // Example job handler
  await boss.work('email:send', async (job: any) => {
    // TODO: integrate with real mailer
    // eslint-disable-next-line no-console
    console.log('email:send job', job.data);
  });

  // eslint-disable-next-line no-console
  console.log('pg-boss worker started');
  return boss;
}

// Allow running as a standalone worker process
if (import.meta.url === `file://${process.argv[1]}`) {
  startWorker().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Worker failed to start', err);
    process.exit(1);
  });
}
