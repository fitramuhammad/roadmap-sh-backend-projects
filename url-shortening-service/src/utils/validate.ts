type ErrorCode =
  | "INVALID_URL"
  | "INVALID_CUSTOM_CODE"
  | "SHORT_CODE_EXISTS"
  | "NOT_FOUND";

const RESERVED_CODES = new Set(["api", "health", "favicon.ico"]);

export class AppError extends Error {
  constructor(public code: ErrorCode) {
    super(code);
    this.name = "AppError";
  }
}

export const parseHttpUrl = (value: unknown): string => {
  if (typeof value !== "string") {
    throw new AppError("INVALID_URL");
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new AppError("INVALID_URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new AppError("INVALID_URL");
  }

  return url.href;
};

export const isValidCustomCode = (value: string): boolean => {
  return /^[A-Za-z0-9_-]{3,30}$/.test(value) && !RESERVED_CODES.has(value);
};
