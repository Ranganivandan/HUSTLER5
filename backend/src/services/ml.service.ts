export type FaceVerifyResult = { ok: boolean; score: number; reason?: string };

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Face verification timeout')), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }).catch((e) => { clearTimeout(t); reject(e); });
  });
}

export const MlService = {
  async verifyFace(publicId?: string): Promise<FaceVerifyResult> {
    if (!publicId) return { ok: false, score: 0, reason: 'missing_public_id' };
    // Stub: simulate verification
    const score = Math.random();
    const ok = score >= 0.6;
    return withTimeout(Promise.resolve({ ok, score, reason: ok ? undefined : 'low_score' }), 5000);
  },
};
