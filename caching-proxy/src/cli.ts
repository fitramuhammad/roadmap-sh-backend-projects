import { parseArgs } from "util";

interface ServeArgs {
  action: "serve";
  port: string;
  origin: string;
}

interface ClearCacheArgs {
  action: "clear-cache";
}

export type ParsedArgs = ServeArgs | ClearCacheArgs;

export function parseCliArgs(): ParsedArgs {
  const { values } = parseArgs({
    args: Bun.argv,
    options: {
      port: {
        type: "string",
        default: "",
      },
      origin: {
        type: "string",
        default: "",
      },
      "clear-cache": {
        type: "boolean",
        default: false,
      },
    },
    strict: true,
    allowPositionals: true,
  });

  if (values["clear-cache"]) {
    return { action: "clear-cache" };
  }

  if (!values.port || !values.origin) {
    throw new Error("USAGE: caching-proxy --port <number> --origin <url>");
  }

  return { action: "serve", port: values.port, origin: values.origin };
}
