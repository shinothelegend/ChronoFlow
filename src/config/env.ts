import { z } from "zod";

const EnvSchema = z.object({
  RPC_HTTP_URL: z.string().url(),
  RPC_WSS_URL: z.string().url(),
  WALLET_PRIVATE_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "must be a 0x-prefixed 32-byte key"),
  CHAIN_ID: z.coerce.number().int().positive(),
  FLASHBOTS_RELAY_URL: z.string().url().default("https://relay.flashbots.net"),
  FLASHBOTS_AUTH_KEY: z.string().min(1),
  MIN_PROFIT_USD: z.coerce.number().positive().default(25),
  DEXSCREENER_BASE_URL: z.string().url().default("https://api.dexscreener.com"),
  STREAM_PORT: z.coerce.number().int().positive().default(4001),
  TARGET_TOKENS: z.string().min(1),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("\n❌ Missing or invalid environment variables:\n");
    for (const issue of parsed.error.issues) {
      console.error(`   - ${issue.path.join(".")}: ${issue.message}`);
    }
    console.error("\n👉 Run `npm run setup` to be prompted for these interactively.\n");
    process.exit(1);
  }
  return parsed.data;
}
