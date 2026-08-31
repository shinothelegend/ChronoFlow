import { Annotation } from "@langchain/langgraph";
import type { LiquidityPool, MempoolEvent, ProposedRoute, ExecutionStatus } from "./types.js";

// Verify this Annotation API against your installed @langchain/langgraph version — it evolves.
export const ArbitrageState = Annotation.Root({
  targetTokens: Annotation<string[]>({ reducer: (_, next) => next, default: () => [] }),
  liquidityData: Annotation<LiquidityPool[]>({ reducer: (_, next) => next, default: () => [] }),
  mempoolEvents: Annotation<MempoolEvent[]>({
    reducer: (curr, next) => [...curr, ...next].slice(-50),
    default: () => [],
  }),
  proposedRoutes: Annotation<ProposedRoute[]>({ reducer: (_, next) => next, default: () => [] }),
  executionStatus: Annotation<ExecutionStatus>({ reducer: (_, next) => next, default: () => "pending" }),
});

export type ArbitrageStateType = typeof ArbitrageState.State;
