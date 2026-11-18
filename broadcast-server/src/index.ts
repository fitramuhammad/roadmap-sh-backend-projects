#!/usr/bin/env bun

import { argv } from "bun";
import { parseArgs } from "util";
import { startServer } from "./server";
import { connect } from "./client.ts";

const USAGE = `Usage: broadcast-server <command> [options]

Commands:
  start      Start the broadcast server
  connect    Connect to the broadcast server

Options:
  --port <port>          Port to use (default: 3000)
  --username <username>  Username for the client
  -h, --help             Show this help message`;

function printUsage() {
  console.log(USAGE);
}

function parseCli() {
  try {
    return parseArgs({
      args: argv.slice(2),
      options: {
        port: {
          type: "string",
        },
        username: {
          type: "string",
        },
        help: {
          type: "boolean",
          short: "h",
        },
      },
      strict: true,
      allowPositionals: true,
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    printUsage();
    return process.exit(1);
  }
}

const { values, positionals } = parseCli();

if (values.help) {
  printUsage();
  process.exit(0);
}

const command = positionals[0];

if (!command) {
  printUsage();
  process.exit(1);
}

if (positionals.length > 1) {
  console.error(`Unexpected argument: ${positionals[1]}`);
  printUsage();
  process.exit(1);
}

const port = values.port ?? "3000";
const portNumber = Number(port);

if (!Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) {
  console.error(`Invalid port: ${port}`);
  process.exit(1);
}

const username = values.username ?? Bun.randomUUIDv7();

switch (command) {
  case "start":
    startServer(port);
    break;
  case "connect":
    connect(port, username);
    break;
  default:
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
}
