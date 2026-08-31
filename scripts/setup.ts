import { createInterface } from "node:readline/promises";
import { writeFileSync, existsSync, readFileSync } from "node:fs";

const REQUIRED_VARS: { key: string; prompt: string }[] = [
  { key: "RPC_HTTP_URL", prompt: "HTTP RPC URL (e.g. Alchemy/Infura HTTPS endpoint)" },
  { key: "RPC_WSS_URL", prompt: "WebSocket RPC URL (for mempool subscription)" },
  { key: "WALLET_PRIVATE_KEY", prompt: "Wallet private key (0x...) — used to sign txs" },
  { key: "CHAIN_ID", prompt: "Chain ID (1 = Ethereum mainnet, 8453 = Base, ...)" },
  { key: "FLASHBOTS_AUTH_KEY", prompt: "Flashbots auth signer key (any 0x key, no funds needed)" },
  { key: "MIN_PROFIT_USD", prompt: "Minimum net profit in USD to trigger execution [25]" },
  { key: "TARGET_TOKENS", prompt: "Comma-separated token addresses to monitor" },
];

async function main() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const existing = existsSync(".env") ? readFileSync(".env", "utf8") : "";
  const lines = existing.split("\n").filter(Boolean);
  const present = new Set(lines.map((l) => l.split("=")[0]));

  console.log("\n🔑 Agent setup — values are written to your local .env only.\n");

  for (const { key, prompt } of REQUIRED_VARS) {
    if (present.has(key)) continue;
    const answer = await rl.question(`${prompt}: `);
    if (answer.trim()) lines.push(`${key}=${answer.trim()}`);
  }

  writeFileSync(".env", lines.join("\n") + "\n");
  rl.close();
  console.log("\n✅ .env written. Run `npm run dev` to start the agent.\n");
}

main();
