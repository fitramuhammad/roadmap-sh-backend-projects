export function connect(port: string, username: string) {
  const url = new URL(`ws://0.0.0.0:${port}`);
  url.searchParams.set("username", username);
  const ws = new WebSocket(url);

  ws.addEventListener("open", async () => {
    console.log("CONNECTED");

    for await (const line of console) {
      if (line.length === 0) {
        continue;
      }

      if (ws.readyState !== WebSocket.OPEN) {
        break;
      }

      try {
        ws.send(line);
      } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    }

    ws.close(1000, "stdin closed");
  });

  ws.addEventListener("message", (e) => {
    console.log(e.data);
  });

  ws.addEventListener("error", (e) => {
    console.error(e.error);
    ws.close();
    process.exit(1);
  });

  ws.addEventListener("close", (e) => {
    const detail = e.reason ? `code ${e.code}: ${e.reason}` : `code ${e.code}`;
    console.log(`DISCONNECTED (${detail})`);

    const normal = e.code === 1000 || e.code === 1001;
    process.exit(normal ? 0 : 1);
  });

  process.on("SIGINT", () => {
    ws.close();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    ws.close();
    process.exit(0);
  });
}
