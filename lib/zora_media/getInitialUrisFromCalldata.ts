import { decodeFunctionData } from "viem";
import { zoraMediaMintAbi } from "@/lib/abi/zoraMediaMintAbi";

type MintMediaData = {
  tokenURI: string;
  metadataURI: string;
};

function getInitialUrisFromCalldata(input: string): MintMediaData | undefined {
  try {
    const { functionName, args } = decodeFunctionData({
      abi: zoraMediaMintAbi,
      data: input as `0x${string}`,
    });

    if (functionName === "mint") {
      const data = args[0] as MintMediaData;
      return { tokenURI: data.tokenURI, metadataURI: data.metadataURI };
    }

    if (functionName === "mintWithSig") {
      const data = args[1] as MintMediaData;
      return { tokenURI: data.tokenURI, metadataURI: data.metadataURI };
    }
  } catch {
    // Unrecognized calldata or malformed payload.
  }

  return undefined;
}

export default getInitialUrisFromCalldata;
