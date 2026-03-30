import {
  handlerContext,
  Primary_Sales,
  InProcessCreatorFixedPriceSaleStrategy_SaleSet_event,
  InProcessERC20Minter_SaleSet_event,
} from "generated";
import { zeroAddress } from "viem";

async function getLatestSale(
  event: InProcessCreatorFixedPriceSaleStrategy_SaleSet_event | InProcessERC20Minter_SaleSet_event,
  context: handlerContext
): Promise<Primary_Sales> {
  const entityId = `${event.params.mediaContract.toLowerCase()}_${event.params.tokenId}_${event.chainId}`;

  const existingEntity = await context.Primary_Sales.get(entityId);

  const newEntity: Primary_Sales = {
    id: entityId,
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

  if (!existingEntity) return newEntity;

  if (existingEntity.created_at >= event.block.timestamp) return existingEntity;

  return newEntity;
}

export default getLatestSale;
