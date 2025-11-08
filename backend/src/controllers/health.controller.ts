import type { Request, Response } from 'express';
import { prisma } from '../services/prisma.service';
import { cloudinaryClient, cloudinaryPing } from '../services/cloudinary.service';
import { getBossInstance } from '../jobs/worker';

export async function healthHandler(_req: Request, res: Response) {
  const checks = {
    db: { ok: false as boolean, error: undefined as string | undefined },
    cloudinary: { ok: false as boolean, error: undefined as string | undefined },
    queue: { ok: false as boolean, error: undefined as string | undefined },
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db.ok = true;
  } catch (e: any) {
    checks.db.error = e?.message ?? 'DB error';
  }

  try {
    if (!cloudinaryClient) throw new Error('Cloudinary not configured');
    await cloudinaryPing();
    checks.cloudinary.ok = true;
  } catch (e: any) {
    checks.cloudinary.error = e?.message ?? 'Cloudinary error';
  }

  try {
    const boss = getBossInstance();
    // If boss exists, assume running; in extended impl, you could call boss.getState()
    checks.queue.ok = !!boss;
    if (!boss) throw new Error('pg-boss not running');
  } catch (e: any) {
    checks.queue.error = e?.message ?? 'Queue error';
  }

  const status = checks.db.ok && checks.cloudinary.ok && checks.queue.ok ? 200 : 503;
  res.status(status).json({ status: status === 200 ? 'ok' : 'degraded', checks });
}
