import { zeroAddress } from "viem";
import {
  Primary_Sales,
  type InProcessCreatorFixedPriceSaleStrategy_SaleSet_event,
  type InProcessERC20Minter_SaleSet_event,
} from "generated";

export function buildSale(
  event: InProcessCreatorFixedPriceSaleStrategy_SaleSet_event | InProcessERC20Minter_SaleSet_event
): Primary_Sales {
  return {
    id: `${event.params.mediaContract.toLowerCase()}_${event.params.tokenId}_${event.chainId}`,
    collection: event.params.mediaContract.toLowerCase(),
    token_id: event.params.tokenId,
    chain_id: event.chainId,
    created_at: event.block.timestamp,
    transaction_hash: event.transaction.hash,
    sale_start: event.params.salesConfig[0],
    sale_end: event.params.salesConfig[1],
    max_tokens_per_address: event.params.salesConfig[2],
    price_per_token: event.params.salesConfig[3],
    funds_recipient: event.params.salesConfig[4].toLowerCase(),
    currency: event.params.salesConfig[5] ? event.params.salesConfig[5].toLowerCase() : zeroAddress,
  };
}
