import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { agentBus } from "../events/agent-bus.js";
import { loadEnv } from "../config/env.js";

export function startStreamServer() {
  const env = loadEnv();

  const httpServer = createServer((req, res) => {
    if (req.url === "/stream/sse") {
      res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
      res.write(`data: ${JSON.stringify(agentBus.getSnapshot())}\n\n`);
      const onEvent = (e: unknown) => res.write(`data: ${JSON.stringify(e)}\n\n`);
      agentBus.on("agent-event", onEvent);
      req.on("close", () => agentBus.off("agent-event", onEvent));
      return;
    }
    if (req.url === "/state/snapshot") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(agentBus.getSnapshot()));
      return;
    }
    res.writeHead(404).end();
  });

  const wss = new WebSocketServer({ server: httpServer, path: "/stream/ws" });
  wss.on("connection", (socket) => {
    socket.send(JSON.stringify({ type: "snapshot", ...agentBus.getSnapshot() }));
    const onEvent = (e: unknown) => socket.send(JSON.stringify(e));
    agentBus.on("agent-event", onEvent);
    socket.on("close", () => agentBus.off("agent-event", onEvent));
  });

  httpServer.listen(env.STREAM_PORT, () => {
    console.log(`📡 Agent stream ready — ws://localhost:${env.STREAM_PORT}/stream/ws`);
  });
}
