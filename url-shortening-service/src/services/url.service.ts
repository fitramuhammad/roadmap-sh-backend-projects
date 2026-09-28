import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { urls } from "../db/schema";
import { generateShortCode } from "../utils/nanoid";

export async function createShortUrl(url: string, customCode?: string) {
  if (typeof url !== "string" || !URL.canParse(url)) {
    throw new Error("Invalid Url format");
  }

  const code = customCode ?? generateShortCode();

  if (customCode) {
    const [existing] = await db
      .select({ id: urls.id })
      .from(urls)
      .where(eq(urls.shortCode, customCode));

    if (existing) {
      throw new Error("Short code already exists");
    }
  }

  const [newShortUrl] = await db
    .insert(urls)
    .values({ shortCode: code, url })
    .returning({
      id: urls.id,
      url: urls.url,
      shortCode: urls.shortCode,
      createdAt: urls.createdAt,
      updatedAt: urls.updatedAt,
    });

  return newShortUrl;
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

export async function updateUrl(shortCode: string, newUrl: string) {
  if (typeof newUrl !== "string" || !URL.canParse(newUrl)) {
    throw new Error("Invalid Url format");
  }

  const [updaterUrl] = await db
    .update(urls)
    .set({ url: newUrl, updatedAt: new Date().toISOString() })
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

