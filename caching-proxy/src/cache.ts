import { redis } from "bun";

const CACHE_TTL_SECONDS = 3600;

export async function getCache(key: string): Promise<string | null> {
  return await redis.get(key);
}

export async function setCache(key: string, value: unknown): Promise<void> {
  await redis.set(key, JSON.stringify(value));
  await redis.expire(key, CACHE_TTL_SECONDS);
}

export async function clearCache(): Promise<void> {
  let cursor = "0";

  do {
    const [nextCursor, batch] = await redis.send("SCAN", [cursor]);
    cursor = nextCursor;
    await Promise.all(batch.map((key: string) => redis.del(key)));
  } while (cursor !== "0");

  console.log("Cache cleared.");
}
