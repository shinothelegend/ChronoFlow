import { walletClient, account } from "../tools/viem.client.js";
import { agentBus } from "../events/agent-bus.js";
import type { ArbitrageStateType } from "../state/schema.js";

export async function executionNode(state: ArbitrageStateType): Promise<Partial<ArbitrageStateType>> {
  agentBus.emitAgentEvent({ type: "heartbeat", phase: "executing" });
  const route = state.proposedRoutes[0];
  if (!route) return { executionStatus: "reverted" };

  try {
    // TODO: build real multi-hop swap calldata for route.path / route.pools, then
    // submit via tools/flashbots.client.ts instead of the public mempool.
    const txHash = await walletClient.sendTransaction({
      account,
      to: route.pools[0] as `0x${string}`,
      value: 0n,
      data: "0x", // placeholder — replace with encoded swap calldata
    });
    agentBus.emitAgentEvent({ type: "execution:result", phase: "idle", status: "executed", txHash });
    return { executionStatus: "executed" };
  } catch (err) {
    agentBus.emitAgentEvent({ type: "error", phase: "error", message: (err as Error).message, retrying: false });
    return { executionStatus: "reverted" };
  }
}
