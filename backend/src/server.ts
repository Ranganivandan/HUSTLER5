import { createApp } from './app';
import { config } from './config';

async function start() {
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`WorkZen API listening on http://localhost:${config.port}`);
  });
}

start().catch((err) => {
  console.error('Fatal server start error:', err);
  process.exit(1);
});
