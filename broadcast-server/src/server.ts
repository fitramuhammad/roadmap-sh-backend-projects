import type { ServerWebSocket } from "bun";

const HEARTBEAT_INTERVAL_MS = 30_000;

type ClientData = {
  username: string;
  isAlive: boolean;
};

export function startServer(
  port: string,
  host = "127.0.0.1",
  heartbeatIntervalMs = HEARTBEAT_INTERVAL_MS,
) {
  const clients = new Set<ServerWebSocket<ClientData>>();

  try {
    const server = Bun.serve({
      port,
      hostname: host,
      fetch(req, server) {
        const url = new URL(req.url);
        const data: ClientData = {
          username: url.searchParams.get("username")?.trim() ?? "",
          isAlive: true,
        };
        if (server.upgrade(req, { data })) {
          return;
        }

        return new Response("upgrade failed", { status: 426 });
      },
      websocket: {
        data: { username: "", isAlive: true },
        maxPayloadLength: 64 * 1024,
        open(ws) {
          if (ws.data.username.length === 0) {
            ws.close(1008, "username is required.");
            return;
          }

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
        pong(ws) {
          ws.data.isAlive = true;
        },
        close(ws) {
          clients.delete(ws);
        },
      },
    });

    const heartbeat = setInterval(() => {
      for (const client of clients) {
        if (client.readyState !== WebSocket.OPEN) {
          clients.delete(client);
          continue;
        }

        if (!client.data.isAlive) {
          clients.delete(client);
          client.terminate();
          continue;
        }

        client.data.isAlive = false;
        client.ping();
      }
    }, heartbeatIntervalMs);

    heartbeat.unref();

    let shuttingDown = false;

    async function shutdown() {
      if (shuttingDown) {
        return;
      }

      shuttingDown = true;
      clearInterval(heartbeat);
      let exitCode = 0;

      try {
        for (const client of clients) {
          client.close();
        }

        await server.stop(true);
      } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        exitCode = 1;
      } finally {
        process.exit(exitCode);
      }
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
