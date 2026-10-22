import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import type { Hono } from "hono";
import { createTestApp } from "../test/helpers";

type TestApp = ReturnType<typeof createTestApp>;

function postJson(app: Hono, body: unknown) {
  return app.request("/api/shorten", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function putJson(app: Hono, shortCode: string, body: unknown) {
  return app.request(`/api/shorten/${shortCode}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function createShortUrl(
  app: Hono,
  body: Record<string, unknown> = { url: "https://example.com" },
) {
  const response = await postJson(app, body);
  const result = (await response.json()) as {
    shortCode: string;
    url: string;
  };

  return { response, result };
}

describe("shorten routes", () => {
  let testApp: TestApp;

  beforeEach(() => {
    testApp = createTestApp();
  });

  afterEach(() => {
    testApp.close();
  });

  it("creates a short URL", async () => {
    const { response, result } = await createShortUrl(testApp.app);

    expect(response.status).toBe(201);
    expect(typeof result.shortCode).toBe("string");
    expect(result.shortCode).toHaveLength(7);
    expect(result.url).toBe("https://example.com/");
  });

  it("rejects an invalid URL", async () => {
    const response = await postJson(testApp.app, { url: "not a url" });
    const body = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_URL");
  });

  it("rejects a javascript URL", async () => {
    const response = await postJson(testApp.app, {
      url: "javascript:alert(1)",
    });
    const body = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_URL");
  });

  it("rejects invalid custom codes", async () => {
    for (const customCode of ["ab", "a b", "api"]) {
      const response = await postJson(testApp.app, {
        url: "https://example.com",
        customCode,
      });
      const body = (await response.json()) as { error: { code: string } };

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("INVALID_CUSTOM_CODE");
    }
  });

  it("rejects a duplicate custom code", async () => {
    await createShortUrl(testApp.app, {
      url: "https://example.com",
      customCode: "duplicate",
    });

    const response = await postJson(testApp.app, {
      url: "https://example.org",
      customCode: "duplicate",
    });
    const body = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(409);
    expect(body.error.code).toBe("SHORT_CODE_EXISTS");
  });

  it("gets a short URL", async () => {
    const { result } = await createShortUrl(testApp.app);

    const response = await testApp.app.request(
      `/api/shorten/${result.shortCode}`,
    );
    const body = (await response.json()) as { shortCode: string };

    expect(response.status).toBe(200);
    expect(body.shortCode).toBe(result.shortCode);
  });

  it("returns 404 when getting an unknown short code", async () => {
    const response = await testApp.app.request("/api/shorten/unknown");
    const body = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("updates a short URL", async () => {
    const { result } = await createShortUrl(testApp.app);

    const response = await putJson(testApp.app, result.shortCode, {
      url: "https://example.org/new-path",
    });
    const body = (await response.json()) as { url: string };

    expect(response.status).toBe(200);
    expect(body.url).toBe("https://example.org/new-path");
  });

  it("rejects an invalid URL on update", async () => {
    const { result } = await createShortUrl(testApp.app);

    const response = await putJson(testApp.app, result.shortCode, {
      url: "javascript:alert(1)",
    });
    const body = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_URL");
  });

  it("returns 404 when updating an unknown short code", async () => {
    const response = await putJson(testApp.app, "unknown", {
      url: "https://example.org",
    });
    const body = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("deletes a short URL", async () => {
    const { result } = await createShortUrl(testApp.app);

    const response = await testApp.app.request(
      `/api/shorten/${result.shortCode}`,
      { method: "DELETE" },
    );

    expect(response.status).toBe(204);
  });

  it("returns 404 when deleting an unknown short code", async () => {
    const response = await testApp.app.request("/api/shorten/unknown", {
      method: "DELETE",
    });
    const body = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("gets stats for a short URL", async () => {
    const { result } = await createShortUrl(testApp.app);

    const response = await testApp.app.request(
      `/api/shorten/${result.shortCode}/stats`,
    );
    const body = (await response.json()) as { visitCount: number };

    expect(response.status).toBe(200);
    expect(body.visitCount).toBe(0);
  });

  it("returns 404 when getting stats for an unknown short code", async () => {
    const response = await testApp.app.request("/api/shorten/unknown/stats");
    const body = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });
});
