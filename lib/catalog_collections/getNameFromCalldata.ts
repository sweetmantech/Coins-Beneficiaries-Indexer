import { decodeFunctionData } from "viem";
import { crFactoryAbi } from "@/lib/abi/crFactoryAbi";

function getNameFromCalldata(input: string): string {
  try {
    const { functionName, args } = decodeFunctionData({
      abi: crFactoryAbi,
      data: input as `0x${string}`,
    });

    if (
      functionName === "deployReleaseContractWithCalls" ||
      functionName === "deployReleaseContractWithCallsDeterministic"
    ) {
      // _name is the 4th argument (index 3) in all three overloads
      return args[3] as string;
    }
  } catch {
    // unrecognized calldata
  }

  return "";
}

export default getNameFromCalldata;
