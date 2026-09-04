import { getCache, setCache } from "./cache.ts";

export function startServer(port: string, origin: string): void {
  const server = Bun.serve({
    port: Number(port),
    static: {
      "/favicon.ico": async () =>
        new Response(await Bun.file("public/favicon.ico").bytes(), {
          headers: {
            "Content-Type": "image/x-icon",
          },
        }),
    },
    async fetch(req) {
      const { method, url } = req;
      const newUrl = new URL(url);
      const key = method.concat(newUrl.pathname);

      try {
        const cached = await getCache(key);

        if (!cached) {
          const response = await fetch(
            `${origin}${newUrl.pathname}${newUrl.search}`,
          );

          if (!response.ok) {
            return Response.json(
              { errors: { message: "Origin server error" } },
              { status: response.status },
            );
          }

          const responseJson = await response.json();
          await setCache(key, responseJson);

          return Response.json(responseJson, {
            headers: { "X-Cache": "MISS" },
          });
        }

        return Response.json(JSON.parse(cached), {
          headers: { "X-Cache": "HIT" },
        });
      } catch (error) {
        console.error("Proxy error:", error);
        return Response.json(
          { errors: { message: "Internal server error" } },
          { status: 500 },
        );
      }
    },
  });

  console.log(`Server running at ${server.url}`);
  console.log(`Proxying requests to ${origin}`);
}
