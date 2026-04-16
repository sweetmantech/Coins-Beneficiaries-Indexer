import { decodeAbiParameters, decodeFunctionData } from "viem";
import { zoraMediaMintAbi } from "@/lib/abi/zoraMediaMintAbi";
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
          [
            { name: "to", type: "address" },
            { name: "value", type: "uint256" },
            { name: "data", type: "bytes" },
            { name: "operation", type: "uint8" },
            { name: "safeTxGas", type: "uint256" },
            { name: "baseGas", type: "uint256" },
            { name: "gasPrice", type: "uint256" },
            { name: "gasToken", type: "address" },
            { name: "refundReceiver", type: "address" },
            { name: "signatures", type: "bytes" },
          ],
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
