import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { AppError } from "../utils/validate";

const appErrorStatus = {
  INVALID_URL: 400,
  INVALID_CUSTOM_CODE: 400,
  SHORT_CODE_EXISTS: 409,
  NOT_FOUND: 404,
} as const satisfies Record<AppError["code"], number>;

const httpErrorCodes: Record<number, string> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  405: "METHOD_NOT_ALLOWED",
  409: "CONFLICT",
  413: "PAYLOAD_TOO_LARGE",
  415: "UNSUPPORTED_MEDIA_TYPE",
  429: "RATE_LIMITED",
  500: "INTERNAL_ERROR",
};

function getHttpExceptionCode(err: HTTPException): string {
  const propertyCode = (err as HTTPException & { code?: unknown }).code;
  if (typeof propertyCode === "string") {
    return propertyCode;
  }

  if (/^[A-Z][A-Z0-9_]*$/.test(err.message)) {
    return err.message;
  }

  return httpErrorCodes[err.status] ?? `HTTP_${err.status}`;
}

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof AppError) {
    return c.json(
      { error: { code: err.code, message: err.message } },
      appErrorStatus[err.code],
    );
  }

  if (err instanceof HTTPException) {
    return c.json(
      { error: { code: getHttpExceptionCode(err), message: err.message } },
      err.status,
    );
  }

  console.error(err);
  return c.json(
    { error: { code: "INTERNAL_ERROR", message: "Internal Server Error" } },
    500,
  );
};
