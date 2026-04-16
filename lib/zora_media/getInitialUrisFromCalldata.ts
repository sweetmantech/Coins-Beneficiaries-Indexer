import { decodeAbiParameters, decodeFunctionData } from "viem";
import { zoraMediaMintAbi } from "@/lib/abi/zoraMediaMintAbi";
import { safeExecTransactionLayout } from "@/lib/abi/safeExecTransactionLayout";
import normalizeDecodedMediaData from "@/lib/zora_media/normalizeDecodedMediaData";
import { SAFE_EXEC_TRANSACTION_SELECTOR, type ZoraMediaUris } from "@/lib/consts";
import zoraMediaMintPayloadLayouts from "@/lib/zora_media/zoraMediaMintPayloadLayouts";
import extractUrlsFromHexInput from "@/lib/zora_media/extractUrlsFromHexInput";
import extractMediaDataFromUrls from "@/lib/zora_media/extractMediaDataFromUrls";

function getInitialUrisFromCalldata(input: string): ZoraMediaUris | undefined {
  try {
    const { functionName, args } = decodeFunctionData({
      abi: zoraMediaMintAbi,
      data: input as `0x${string}`,
    });

    if (functionName === "mint") {
      return normalizeDecodedMediaData(args[0] as ZoraMediaUris);
    }

    if (functionName === "mintWithSig") {
      return normalizeDecodedMediaData(args[1] as ZoraMediaUris);
    }
  } catch {
    if (input.startsWith(SAFE_EXEC_TRANSACTION_SELECTOR)) {
      try {
        const [, , wrappedData] = decodeAbiParameters(
          safeExecTransactionLayout,
          (input.startsWith("0x") ? `0x${input.slice(10)}` : `0x${input.slice(8)}`) as `0x${string}`
        );

        const wrappedDecoded = getInitialUrisFromCalldata(wrappedData);
        if (wrappedDecoded) return wrappedDecoded;
      } catch {
        // Fall through to generic payload/url probing.
      }
    }

    const encodedArgs = (
      input.startsWith("0x") ? `0x${input.slice(10)}` : `0x${input.slice(8)}`
    ) as `0x${string}`;

    for (const parameters of zoraMediaMintPayloadLayouts) {
      try {
        const decoded = decodeAbiParameters(parameters, encodedArgs);

        for (const value of decoded) {
          if (
            typeof value === "object" &&
            value !== null &&
            "tokenURI" in value &&
            "metadataURI" in value
          ) {
            const mediaData = normalizeDecodedMediaData(value as ZoraMediaUris);
            if (mediaData) return mediaData;
          }
        }
      } catch {
        // Try the next known payload layout.
      }
    }
  }

  return extractMediaDataFromUrls(extractUrlsFromHexInput(input));
}

export default getInitialUrisFromCalldata;
