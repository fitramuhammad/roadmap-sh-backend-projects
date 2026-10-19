import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { urls } from "../db/schema";
import { generateShortCode } from "../utils/nanoid";
import { AppError, isValidCustomCode, parseHttpUrl } from "../utils/validate";

export async function createShortUrl(url: unknown, customCode?: unknown) {
  const normalizedUrl = parseHttpUrl(url);

  let code = generateShortCode();

  if (customCode !== undefined && customCode !== null && customCode !== "") {
    if (typeof customCode !== "string" || !isValidCustomCode(customCode)) {
      throw new AppError("INVALID_CUSTOM_CODE");
    }

    code = customCode;
  }

  try {
    const [newShortUrl] = await db
      .insert(urls)
      .values({ shortCode: code, url: normalizedUrl })
      .returning({
        id: urls.id,
        url: urls.url,
        shortCode: urls.shortCode,
        createdAt: urls.createdAt,
        updatedAt: urls.updatedAt,
      });

    if (!newShortUrl) {
      throw new Error("Insert returned no row");
    }

    return newShortUrl;
  } catch (error) {
    if (error instanceof AppError) throw error;

    if (
      error instanceof Error &&
      (error.message.includes("UNIQUE constraint failed") ||
        error.message.includes("SQLITE_CONSTRAINT"))
    ) {
      throw new AppError("SHORT_CODE_EXISTS");
    }

    throw error;
  }
}

export async function getUrlByShortCode(shortCode: string) {
  const [url] = await db
    .select({
      id: urls.id,
      url: urls.url,
      shortCode: urls.shortCode,
      createdAt: urls.createdAt,
      updatedAt: urls.updatedAt,
    })
    .from(urls)
    .where(eq(urls.shortCode, shortCode));
  return url ?? null;
}

export async function updateUrl(shortCode: string, newUrl: unknown) {
  const normalizedUrl = parseHttpUrl(newUrl);

  const [updaterUrl] = await db
    .update(urls)
    .set({ url: normalizedUrl, updatedAt: new Date().toISOString() })
    .where(eq(urls.shortCode, shortCode))
    .returning();

  return updaterUrl ?? null;
}

export async function deleteUrl(shortCode: string) {
  const deletedUrl = await db
    .delete(urls)
    .where(eq(urls.shortCode, shortCode))
    .returning();

  return deletedUrl.length !== 0;
}

export async function incrementVisitCount(shortCode: string) {
  await db
    .update(urls)
    .set({ visitCount: sql`${urls.visitCount} + 1` })
    .where(eq(urls.shortCode, shortCode));
}

export async function getUrlStats(shortCode: string) {
  const [record] = await db
    .select()
    .from(urls)
    .where(eq(urls.shortCode, shortCode));
  return record ?? null;
}
