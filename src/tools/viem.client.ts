import { createPublicClient, createWalletClient, http, webSocket } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains"; // swap for the chain matching CHAIN_ID
import { loadEnv } from "../config/env.js";

const env = loadEnv();

export const publicClient = createPublicClient({ chain: mainnet, transport: http(env.RPC_HTTP_URL) });
export const wsClient = createPublicClient({ chain: mainnet, transport: webSocket(env.RPC_WSS_URL) });
export const account = privateKeyToAccount(env.WALLET_PRIVATE_KEY as `0x${string}`);
export const walletClient = createWalletClient({ account, chain: mainnet, transport: http(env.RPC_HTTP_URL) });

export function subscribeToPendingTransactions(onTx: (hash: `0x${string}`) => void) {
  return wsClient.watchPendingTransactions({
    onTransactions: (hashes) => hashes.forEach(onTx),
    onError: (err) => console.error("mempool subscription error:", err),
  });
}
