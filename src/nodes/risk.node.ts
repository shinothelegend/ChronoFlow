import { agentBus } from "../events/agent-bus.js";
import { loadEnv } from "../config/env.js";
import type { ArbitrageStateType } from "../state/schema.js";

const env = loadEnv();
const MAX_RISK_SCORE = 0.5;

export async function riskNode(state: ArbitrageStateType): Promise<Partial<ArbitrageStateType>> {
  agentBus.emitAgentEvent({ type: "heartbeat", phase: "validating" });

  const viable = state.proposedRoutes.find((r: any) => r.netProfitUsd > env.MIN_PROFIT_USD && r.riskScore <= MAX_RISK_SCORE);
  if (viable) return { proposedRoutes: [viable], executionStatus: "pending" };

  const risky = state.proposedRoutes.find((r: any) => r.riskScore > MAX_RISK_SCORE);
  if (risky) {
    agentBus.emitAgentEvent({ type: "risk:flagged", phase: "hedged", routeId: risky.id, reason: "risk score exceeds threshold" });
    // TODO: implement an actual hedge (e.g. short on a perps protocol) here.
    return { executionStatus: "hedged" };
  }
  return { executionStatus: "reverted" };
}
