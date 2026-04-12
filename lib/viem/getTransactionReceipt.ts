import { Hash } from "viem";
import { baseClient, baseSepoliaClient } from "./client";
import { base, baseSepolia } from "viem/chains";

const getTransactionReceipt = async (hash: Hash, chain: typeof base.id | typeof baseSepolia.id) => {
  const client = chain === base.id ? baseClient : baseSepoliaClient;
  const receipt = await client.getTransactionReceipt({
    hash,
  });
  return receipt;
};

export default getTransactionReceipt;
