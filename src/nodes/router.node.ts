import { publicClient } from "../tools/viem.client.js";
import { agentBus } from "../events/agent-bus.js";
import type { ArbitrageStateType } from "../state/schema.js";
import type { LiquidityPool, ProposedRoute } from "../state/types.js";

const SLIPPAGE_BPS = 50; // 0.5%

export async function routerNode(state: ArbitrageStateType): Promise<Partial<ArbitrageStateType>> {
  agentBus.emitAgentEvent({ type: "heartbeat", phase: "simulating" });
  const routes: ProposedRoute[] = [];

  // TODO: replace with real multi-pool path-finding across state.liquidityData.
  for (const pool of state.liquidityData) {
    try {
      const grossProfitUsd = estimateGrossProfit(pool, state.liquidityData);
      if (grossProfitUsd <= 0) continue;

      const estGasUsd = await estimateGasCostUsd();
      const netProfitUsd = grossProfitUsd - estGasUsd - grossProfitUsd * (SLIPPAGE_BPS / 10_000);

      const route: ProposedRoute = {
        id: `${pool.pairAddress}-${Date.now()}`,
        path: [pool.baseToken, pool.quoteToken],
        pools: [pool.pairAddress],
        grossProfitUsd,
        estGasUsd,
        netProfitUsd,
        riskScore: pool.liquidityUsd < 10_000 ? 0.8 : 0.2,
      };
      routes.push(route);
      agentBus.emitAgentEvent({ type: "route:proposed", phase: "simulating", route });
    } catch (err) {
      agentBus.emitAgentEvent({ type: "error", phase: "error", message: (err as Error).message, retrying: false });
    }
  }
  return { proposedRoutes: routes };
}

function estimateGrossProfit(pool: LiquidityPool, allPools: LiquidityPool[]): number {
  // Placeholder: compare this pool's price against the best price elsewhere for the same pair.
  return 0;
}

async function estimateGasCostUsd(): Promise<number> {
  const gasPrice = await publicClient.getGasPrice();
  const estimatedGasUnits = 250_000n;
  const ethPriceUsd = 3000; // TODO: pull live ETH price instead of hardcoding
  return (Number(gasPrice * estimatedGasUnits) / 1e18) * ethPriceUsd;
}
