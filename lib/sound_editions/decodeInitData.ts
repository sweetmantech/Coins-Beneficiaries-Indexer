import { decodeAbiParameters } from "viem";

// SoundEditionInitialized fires BEFORE Created in the same transaction,
// so contractRegister always misses it. Decode initData from Created instead.
export function decodeInitData(initData: string): { name: string; contractURI: string } {
  try {
    // Strip 4-byte function selector, decode the rest as EditionInitialization tuple
    const encodedArgs = `0x${initData.slice(10)}` as `0x${string}`;
    const [init] = decodeAbiParameters(
      [
        {
          name: "init",
          type: "tuple",
          components: [
            { name: "name", type: "string" },
            { name: "symbol", type: "string" },
            { name: "metadataModule", type: "address" },
            { name: "baseURI", type: "string" },
            { name: "contractURI", type: "string" },
            { name: "fundingRecipient", type: "address" },
            { name: "royaltyBPS", type: "uint16" },
            { name: "isCreateTierFrozen", type: "bool" },
            { name: "isMintRandomnessEnabled", type: "bool" },
            {
              name: "tierCreations",
              type: "tuple[]",
              components: [
                { name: "tier", type: "uint8" },
                { name: "maxMintableLower", type: "uint32" },
                { name: "maxMintableUpper", type: "uint32" },
                { name: "cutoffTime", type: "uint32" },
                { name: "mintRandomnessEnabled", type: "bool" },
                { name: "isFrozen", type: "bool" },
              ],
            },
          ],
        },
      ] as const,
      encodedArgs
    );
    return { name: init.name, contractURI: init.contractURI };
  } catch {
    return { name: "", contractURI: "" };
  }
}
