import { zeroAddress } from "viem";
import { type Primary_Sales } from "envio";

interface SaleSetEvent {
  params: {
    mediaContract: string;
    tokenId: bigint;
    salesConfig: readonly [bigint, bigint, bigint, bigint, string, (string | undefined)?];
  };
  chainId: number;
  block: { timestamp: number };
  transaction: { hash: string };
}

export function buildSale(event: SaleSetEvent): Primary_Sales {
  const collection = event.params.mediaContract.toLowerCase();
  const currency = event.params.salesConfig[5];
  return {
    id: `${collection}_${event.params.tokenId}_${event.chainId}`,
    collection,
    token_id: event.params.tokenId,
    chain_id: event.chainId,
    created_at: event.block.timestamp,
    transaction_hash: event.transaction.hash,
    sale_start: event.params.salesConfig[0],
    sale_end: event.params.salesConfig[1],
    max_tokens_per_address: event.params.salesConfig[2],
    price_per_token: event.params.salesConfig[3],
    funds_recipient: event.params.salesConfig[4].toLowerCase(),
    currency: currency ? currency.toLowerCase() : zeroAddress,
  };
}
