export interface LiquidityPool {
  pairAddress: string;
  baseToken: string;
  quoteToken: string;
  priceUsd: number;
  liquidityUsd: number;
  volume24hUsd: number;
  dexId: string;
}

export interface MempoolEvent {
  hash: string;
  from: string;
  to: string;
  valueUsd?: number;
  detectedAt: number;
}

export interface ProposedRoute {
  id: string;
  path: string[];       // token addresses in swap order
  pools: string[];       // pool addresses used
  grossProfitUsd: number;
  estGasUsd: number;
  netProfitUsd: number;
  riskScore: number;     // 0–1
}

export type ExecutionStatus = "pending" | "executed" | "reverted" | "hedged";

/**
 * ---- UI-AGNOSTIC EVENT CONTRACT ----
 * Any future frontend subscribes to these over WS/SSE. Treat as a public API.
 */
export type AgentPhase = "idle" | "scanning" | "simulating" | "validating" | "executing" | "hedged" | "error";

export interface AgentEventBase {
  timestamp: number;
  previousPhase: AgentPhase;
  phase: AgentPhase;
  durationHintMs?: number;
}

export type AgentEvent =
  | (AgentEventBase & { type: "heartbeat" })
  | (AgentEventBase & { type: "liquidity:update"; pools: LiquidityPool[] })
  | (AgentEventBase & { type: "mempool:event"; event: MempoolEvent })
  | (AgentEventBase & { type: "route:proposed"; route: ProposedRoute })
  | (AgentEventBase & { type: "risk:flagged"; routeId: string; reason: string })
  | (AgentEventBase & { type: "execution:result"; status: ExecutionStatus; txHash?: string })
  | (AgentEventBase & { type: "error"; message: string; retrying: boolean });

export const CONTRACT_VERSION = "1.0.0";
