# Broadcast Server

A CLI [broadcast server](https://roadmap.sh/projects/broadcast-server) built with Bun and WebSockets. One process runs the server and other processes connect as clients. Every message a client sends is delivered to all connected clients.

## Requirements

- Bun 1.4 or newer

## Install

```bash
bun install
```

## Run

Start the server:

```bash
bun start
```

Start the server on another port:

```bash
bun run src/index.ts start --port 4000
```

Connect a client in a second terminal:

```bash
bun run src/index.ts connect --port 3000 --username alice
```

Connect a second client:

```bash
bun run src/index.ts connect --port 3000 --username bob
```

Type a message in one client and press Enter. Both clients print the message:

```text
alice send: hello
```

Use Ctrl+C to disconnect. The client also exits when the server closes the connection.

## Options

| Option                  | Used by        | Description                                                              |
| ----------------------- | -------------- | ------------------------------------------------------------------------ |
| `--port <port>`         | start, connect | Port to use. Default `3000`.                                             |
| `--host <host>`         | start, connect | Host to bind or connect to. Default `127.0.0.1`.                         |
| `--username <username>` | connect        | Client name. Defaults to a UUID. Must be unique among connected clients. |
| `-h`, `--help`          | start, connect | Print usage.                                                             |

Start and connect must use the same port. The client `--host` value is the address of the server, not the address the server binds to.

## Host and network

By default the server only listens on `127.0.0.1`, so other machines cannot connect. To accept connections from the local network:

```bash
bun run src/index.ts start --host 0.0.0.0
```

Then connect from another machine using the server's IP address:

```bash
bun run src/index.ts connect --host 192.168.1.10 --username alice
```

IPv6 addresses work as well, for example `--host ::1`.

## Behavior

- Messages are broadcast to every connected client, including the sender.
- A username can only be used by one connected client. A duplicate is rejected with close code `1008` and the reason `username already exists.`
- Empty input lines are ignored.
- The client exits with code `0` for a normal close and code `1` for a rejected connection or error.
- Messages are not stored. A new client only sees messages sent after it connects.

## Development

Run the type checker:

```bash
bun check
```

Project layout:

- `src/index.ts` parses CLI arguments.
- `src/server.ts` runs the WebSocket server and broadcast logic.
- `src/client.ts` reads stdin and prints incoming messages.

## Global command

The package defines a `broadcast-server` binary. To use it globally:

```bash
bun link
broadcast-server --help
```
