import {
  handlerContext,
  Primary_Sales,
  USDCFixedPriceController_MintConfigurationUpdated_event,
} from "generated";
import { USDC_ADDRESSES } from "@/lib/consts";
import { maxUint256 } from "viem";

async function getLatestSale(
  event: USDCFixedPriceController_MintConfigurationUpdated_event,
  context: handlerContext
): Promise<Primary_Sales> {
  const collection = event.params.releaseContract.toLowerCase();
  const tokenId = event.params.tokenId;
  const entityId = `${collection}_${tokenId}_${event.chainId}`;

  const existingEntity = await context.Primary_Sales.get(entityId);

  const newEntity: Primary_Sales = {
    id: entityId,
    collection,
    token_id: tokenId,
    price_per_token: event.params.configuration[0],
    funds_recipient: event.params.configuration[1].toLowerCase(),
    currency: USDC_ADDRESSES[event.chainId] ?? "",
    sale_start: BigInt(0),
    sale_end: maxUint256,
    max_tokens_per_address: maxUint256,
    chain_id: event.chainId,
    created_at: event.block.timestamp,
    transaction_hash: event.transaction.hash,
  };

  if (!existingEntity) return newEntity;
  if (existingEntity.created_at >= event.block.timestamp) return existingEntity;

  return newEntity;
}

export default getLatestSale;
