import { agentBus } from "../events/agent-bus.js";
import { fetchPoolsForToken } from "../tools/dexscreener.client.js";
import type { ArbitrageStateType } from "../state/schema.js";

export async function monitorNode(state: ArbitrageStateType): Promise<Partial<ArbitrageStateType>> {
  agentBus.emitAgentEvent({ type: "heartbeat", phase: "scanning" });
  try {
    const pools = (await Promise.all(state.targetTokens.map(fetchPoolsForToken))).flat();
    agentBus.emitAgentEvent({ type: "liquidity:update", phase: "scanning", pools });
    return { liquidityData: pools };
  } catch (err) {
    agentBus.emitAgentEvent({ type: "error", phase: "error", message: (err as Error).message, retrying: true });
    return {}; // keep prior liquidityData rather than wiping state on a transient failure
  }
}
