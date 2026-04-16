import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

const mediaReadAbi = [
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "tokenMetadataURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

type MintMediaData = {
  tokenURI: string;
  metadataURI: string;
};

const fallbackRpcUrl = process.env.ZORA_FALLBACK_RPC_URL;
const fallbackClient = fallbackRpcUrl
  ? createPublicClient({
      chain: mainnet,
      transport: http(fallbackRpcUrl),
    })
  : undefined;

async function readMintUrisFromChain(
  collection: string,
  tokenId: bigint
): Promise<MintMediaData | undefined> {
  if (!fallbackClient) return undefined;

  try {
    const [tokenURI, metadataURI] = await Promise.all([
      fallbackClient.readContract({
        address: collection as `0x${string}`,
        abi: mediaReadAbi,
        functionName: "tokenURI",
        args: [tokenId],
      }),
      fallbackClient.readContract({
        address: collection as `0x${string}`,
        abi: mediaReadAbi,
        functionName: "tokenMetadataURI",
        args: [tokenId],
      }),
    ]);

    return { tokenURI, metadataURI };
  } catch {
    return undefined;
  }
}

export default readMintUrisFromChain;
