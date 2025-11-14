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

// NOTE: Standalone ESM launch via import.meta was removed to support CommonJS compilation.
// To run this worker explicitly, use the provided npm script:
//   yarn worker:start
