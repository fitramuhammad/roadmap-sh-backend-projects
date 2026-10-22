import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { createTestApp } from "../test/helpers";

type TestApp = ReturnType<typeof createTestApp>;

async function createShortUrl(
  app: TestApp["app"],
  target: string,
) {
  const response = await app.request("/api/shorten", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: target }),
  });
  const body = (await response.json()) as { shortCode: string };

  return body.shortCode;
}

describe("redirect routes", () => {
  let testApp: TestApp;

  beforeEach(() => {
    testApp = createTestApp();
  });

  afterEach(() => {
    testApp.close();
  });

  it("redirects to the target URL", async () => {
    const target = "https://example.com/docs?lang=id";
    const shortCode = await createShortUrl(testApp.app, target);

    const response = await testApp.app.request(`/${shortCode}`, {
      redirect: "manual",
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(target);
  });

  it("increments the visit count after a redirect", async () => {
    const shortCode = await createShortUrl(
      testApp.app,
      "https://example.com",
    );

    await testApp.app.request(`/${shortCode}`, { redirect: "manual" });
    await testApp.app.request(`/${shortCode}`, { redirect: "manual" });

    const response = await testApp.app.request(
      `/api/shorten/${shortCode}/stats`,
    );
    const body = (await response.json()) as { visitCount: number };

    expect(response.status).toBe(200);
    expect(body.visitCount).toBe(2);
  });

  it("returns 404 for an unknown short code", async () => {
    const response = await testApp.app.request("/unknown");
    const body = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });
});
