import { loadEnv } from "../config/env.js";

const env = loadEnv();

/**
 * Minimal private-relay bundle submitter. Swap for @flashbots/ethers-provider-bundle
 * if you need simulation + multi-tx bundles.
 */
export async function sendPrivateBundle(signedTxs: string[], targetBlock: bigint) {
  const res = await fetch(env.FLASHBOTS_RELAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_sendBundle",
      params: [{ txs: signedTxs, blockNumber: `0x${targetBlock.toString(16)}` }],
    }),
  });
  if (!res.ok) throw new Error(`Flashbots relay error: ${res.status}`);
  return res.json();
}
