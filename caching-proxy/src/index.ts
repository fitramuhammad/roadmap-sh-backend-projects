import { parseCliArgs } from "./cli.ts";
import { clearCache } from "./cache.ts";
import { startServer } from "./server.ts";

try {
  const args = parseCliArgs();

  if (args.action === "clear-cache") {
    await clearCache();
  } else {
    startServer(args.port, args.origin);
  }
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
    process.exit(1);
  }
}
