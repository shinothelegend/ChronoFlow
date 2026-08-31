import "dotenv/config";
import { loadEnv } from "./config/env.js";
import { buildGraph } from "./graph/build-graph.js";
import { startStreamServer } from "./server/stream.server.js";
import type { ArbitrageStateType } from "./state/schema.js";
import { agentBus } from "./events/agent-bus.js";

const env = loadEnv();
const POLL_INTERVAL_MS = 8000;

async function main() {
  startStreamServer();
  const app = buildGraph();

  let state: ArbitrageStateType = {
    targetTokens: env.TARGET_TOKENS.split(",").filter(Boolean),
    liquidityData: [],
    mempoolEvents: [],
    proposedRoutes: [],
    executionStatus: "pending" as const,
  };

  console.log("🤖 Arbitrage agent loop starting…");
  while (true) {
    try {
      state = await app.invoke(state);
    } catch (err) {
      agentBus.emitAgentEvent({ type: "error", phase: "error", message: (err as Error).message, retrying: true });
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

main();
