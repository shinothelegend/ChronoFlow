export async function withRetry<T>(
  fn: () => Promise<T>,
  { retries = 3, baseDelayMs = 500 }: { retries?: number; baseDelayMs?: number } = {}
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await new Promise((r) => setTimeout(r, baseDelayMs * attempt));
    }
  }
  throw lastErr;
}
