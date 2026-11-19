import type { ServerWebSocket } from "bun";

export function startServer(port: string) {
  const clients = new Set<ServerWebSocket<{ username: string }>>();

  try {
    const server = Bun.serve({
      port,
      fetch(req, server) {
        const url = new URL(req.url);
        const data = {
          username: url.searchParams.get("username") || Bun.randomUUIDv7(),
        };
        if (server.upgrade(req, { data })) {
          return;
        }

        return new Response("upgrade failed", { status: 426 });
      },
      websocket: {
        data: {} as { username: string },
        open(ws) {
          const existing = clients
            .values()
            .find((client) => client.data.username === ws.data.username);

          if (existing) {
            ws.close(1008, "username already exists.");
            return;
          }

          clients.add(ws);
        },
        message(ws, message) {
          const sender = ws.data.username;

          clients.values().forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              try {
                client.send(`${sender} send: ${message}`);
              } catch {
                clients.delete(client);
              }
            }
          });
        },
        close(ws) {
          clients.delete(ws);
        },
      },
    });

    async function shutdown() {
      clients.forEach((client) => {
        client.close();
      });
      await server.stop(true);
      process.exit(0);
    }

    process.once("SIGTERM", shutdown);
    process.once("SIGINT", shutdown);

    console.log(`server listening on port: ${server.port}`);

    return server;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
