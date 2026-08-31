import type { LiquidityPool } from "../state/types.js";
import { withRetry } from "../utils/retry.js";
import { loadEnv } from "../config/env.js";

const env = loadEnv();

export async function fetchPoolsForToken(tokenAddress: string): Promise<LiquidityPool[]> {
  return withRetry(async () => {
    const res = await fetch(`${env.DEXSCREENER_BASE_URL}/latest/dex/tokens/${tokenAddress}`);
    if (!res.ok) throw new Error(`DexScreener ${res.status}: ${res.statusText}`);
    const json = await res.json();
    return (json.pairs ?? []).map((p: any) => ({
      pairAddress: p.pairAddress,
      baseToken: p.baseToken?.address,
      quoteToken: p.quoteToken?.address,
      priceUsd: Number(p.priceUsd ?? 0),
      liquidityUsd: Number(p.liquidity?.usd ?? 0),
      volume24hUsd: Number(p.volume?.h24 ?? 0),
      dexId: p.dexId,
    }));
  });
}
