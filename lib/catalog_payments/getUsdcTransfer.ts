import { Address, zeroAddress } from "viem";
import { CatalogRelease1155_TokenPurchased_event } from "generated";
import { baseClient, baseSepoliaClient } from "../viem/client";
import formatUnits from "../formatUnits";
import { abi } from "../abi/catalogAbi";

type Payout = {
  recipient: Address;
  amount: string;
};

const getUsdcTransfer = async (event: CatalogRelease1155_TokenPurchased_event): Promise<Payout> => {
  try {
    const client = event.chainId === 8453 ? baseClient : baseSepoliaClient;
    const address = event.srcAddress as Address;
    const tokenId = event.params.tokenId;

    const [tokenInfo, tokenPrice] = await client.multicall({
      contracts: [
        { address, abi, functionName: "tokenInfo", args: [tokenId] },
        { address, abi, functionName: "tokenPrice", args: [tokenId] },
      ],
    });

    const recipient = (tokenInfo.result?.artist ?? zeroAddress) as Address;
    const amount = formatUnits((tokenPrice.result as bigint) ?? 0n, 6);

    return { recipient, amount };
  } catch (err) {
    console.warn("Failed to fetch token info for tx", event.transaction.hash, err);
    return {
      recipient: zeroAddress,
      amount: "0.000000",
    };
  }
};

export default getUsdcTransfer;
