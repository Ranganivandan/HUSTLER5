import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TOKEN_TTL: z.string().default('1h'),
  REFRESH_TOKEN_TTL: z.string().default('30d'),
  BCRYPT_ROUNDS: z.coerce.number().default(10),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
  PGBOSS_SCHEMA: z.string().default('pgboss'),
  PGBOSS_MONITOR_INTERVAL: z.coerce.number().default(30000),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten());
  process.exit(1);
}

export const config = {
  nodeEnv: parsed.data.NODE_ENV,
  port: parsed.data.PORT,
  dbUrl: parsed.data.DATABASE_URL,
  jwt: {
    accessSecret: parsed.data.JWT_ACCESS_SECRET,
    refreshSecret: parsed.data.JWT_REFRESH_SECRET,
    accessTtl: parsed.data.ACCESS_TOKEN_TTL,
    refreshTtl: parsed.data.REFRESH_TOKEN_TTL,
  },
  bcryptRounds: parsed.data.BCRYPT_ROUNDS,
  cloudinary: {
    cloudName: parsed.data.CLOUDINARY_CLOUD_NAME,
    apiKey: parsed.data.CLOUDINARY_API_KEY,
    apiSecret: parsed.data.CLOUDINARY_API_SECRET,
  },
  boss: {
    schema: parsed.data.PGBOSS_SCHEMA,
    monitorInterval: parsed.data.PGBOSS_MONITOR_INTERVAL,
  },
};
