import { publicClient } from "../tools/viem.client.js";
import { agentBus } from "../events/agent-bus.js";
import type { ArbitrageStateType } from "../state/schema.js";
import type { LiquidityPool, ProposedRoute } from "../state/types.js";

const SLIPPAGE_BPS = 50; // 0.5%

export async function routerNode(state: ArbitrageStateType): Promise<Partial<ArbitrageStateType>> {
  agentBus.emitAgentEvent({ type: "heartbeat", phase: "simulating" });
  const routes: ProposedRoute[] = [];

  // Group pools by token pair
  const pairs = new Map<string, LiquidityPool[]>();
  for (const pool of state.liquidityData) {
    // Normalize pair key so A-B is same as B-A
    const tokens = [pool.baseToken.toLowerCase(), pool.quoteToken.toLowerCase()].sort();
    const key = `${tokens[0]}-${tokens[1]}`;
    if (!pairs.has(key)) pairs.set(key, []);
    pairs.get(key)!.push(pool);
  }

  const estGasUsd = await estimateGasCostUsd();

  for (const [key, pools] of pairs.entries()) {
    if (pools.length < 2) continue; // Need at least two markets to arbitrage

    // Sort pools by price to find max spread
    const sorted = [...pools].sort((a, b) => a.priceUsd - b.priceUsd);
    const cheapestPool = sorted[0];
    const mostExpensivePool = sorted[sorted.length - 1];

    if (cheapestPool.dexId === mostExpensivePool.dexId) continue; // Must be cross-dex

    const grossProfitUsd = estimateGrossProfit(cheapestPool, mostExpensivePool);
    if (grossProfitUsd <= 0) continue;

    const netProfitUsd = grossProfitUsd - estGasUsd - (grossProfitUsd * (SLIPPAGE_BPS / 10_000));

    // Calculate a naive risk score based on liquidity of both pools
    const minLiquidity = Math.min(cheapestPool.liquidityUsd, mostExpensivePool.liquidityUsd);
    const riskScore = minLiquidity < 10_000 ? 0.8 : (minLiquidity > 100_000 ? 0.1 : 0.4);

    const route: ProposedRoute = {
      id: `${cheapestPool.pairAddress}-${mostExpensivePool.pairAddress}-${Date.now()}`,
      path: [cheapestPool.baseToken, cheapestPool.quoteToken], // simplified 2-hop path
      pools: [cheapestPool.pairAddress, mostExpensivePool.pairAddress],
      grossProfitUsd,
      estGasUsd,
      netProfitUsd,
      riskScore,
    };
    routes.push(route);
    agentBus.emitAgentEvent({ type: "route:proposed", phase: "simulating", route });
  }

  // Sort routes by net profit
  routes.sort((a, b) => b.netProfitUsd - a.netProfitUsd);

  return { proposedRoutes: routes };
}

function estimateGrossProfit(buyPool: LiquidityPool, sellPool: LiquidityPool): number {
  // Simple heuristic: 0.1% spread = profit margin on the trade size.
  // We assume a trade size equal to 1% of the smallest pool's liquidity.
  const tradeSizeUsd = Math.min(buyPool.liquidityUsd, sellPool.liquidityUsd) * 0.01;
  const priceDiffPct = (sellPool.priceUsd - buyPool.priceUsd) / buyPool.priceUsd;
  
  if (priceDiffPct <= 0.005) return 0; // Require at least 0.5% price difference to even attempt

  return tradeSizeUsd * priceDiffPct;
}

async function estimateGasCostUsd(): Promise<number> {
  let gasPrice = 20000000000n; // 20 gwei default
  try {
    gasPrice = await publicClient.getGasPrice();
  } catch (err) { }
  
  const estimatedGasUnits = 250_000n;
  
  // Try to pull live ETH price using DexScreener API
  let ethPriceUsd = 3000;
  try {
    const res = await fetch('https://api.dexscreener.com/latest/dex/tokens/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
    if (res.ok) {
      const json = await res.json();
      if (json.pairs && json.pairs.length > 0) {
        ethPriceUsd = Number(json.pairs[0].priceUsd);
      }
    }
  } catch (err) {
    // silently fallback to hardcoded
  }

  return (Number(gasPrice * estimatedGasUnits) / 1e18) * ethPriceUsd;
}
