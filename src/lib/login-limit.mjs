// Local development only. Production uses shared Blob counters.
export function createLocalLoginLimiter() {
 const attempts = new Map();
 return (key, now = Date.now()) => {
  for (const [id, entry] of attempts) if (entry.reset <= now) attempts.delete(id);
  const entry = attempts.get(key);
  if (entry && entry.count >= 8) return false;
  if (!entry && attempts.size >= 10000) return false;
  attempts.set(key, {count: (entry?.count || 0) + 1, reset: entry?.reset ?? now + 15 * 60000});
  return true;
 };
}
