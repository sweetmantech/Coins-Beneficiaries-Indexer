import { createPublicClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";

export const baseClient = createPublicClient({
  chain: base,
  transport: http(),
});

export const baseSepoliaClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});
