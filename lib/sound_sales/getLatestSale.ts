import { handlerContext, Primary_Sales, SuperMinterV2_MintCreated_event } from "generated";
import { zeroAddress } from "viem";

// MintCreation tuple field indexes (verified against on-chain ABI):
// [0] edition (address), [1] price (uint96), [2] startTime (uint32), [3] endTime (uint32)
// [4] maxMintablePerAccount (uint32), [5] maxMintable (uint32), [6] affiliateFeeBPS (uint16)
// [7] affiliateMerkleRoot (bytes32), [8] tier (uint8), [9] platform (address)
// [10] mode (uint8), [11] merkleRoot (bytes32)
async function getLatestSale(
  event: SuperMinterV2_MintCreated_event,
  context: handlerContext
): Promise<Primary_Sales> {
  const edition = event.params.edition.toLowerCase();
  const tier = event.params.tier;
  const entityId = `${edition}_${tier}_${event.chainId}`;

  const existingEntity = await context.Primary_Sales.get(entityId);

  const soundEdition = await context.Sound_Editions.get(`${edition}_${event.chainId}`);
  const fundsRecipient = soundEdition?.funding_recipient ?? zeroAddress;

  const creation = event.params.creation;

  const newEntity: Primary_Sales = {
    id: entityId,
    collection: edition,
    token_id: BigInt(tier),
    price_per_token: creation[1], // price (uint96)
    funds_recipient: fundsRecipient,
    currency: zeroAddress, // Sound.xyz uses ETH
    sale_start: BigInt(creation[2]), // startTime (uint32)
    sale_end: BigInt(creation[3]), // endTime (uint32)
    max_tokens_per_address: BigInt(creation[4]), // maxMintablePerAccount (uint32)
    chain_id: event.chainId,
    transaction_hash: event.transaction.hash,
    created_at: event.block.timestamp,
  };

  if (!existingEntity) return newEntity;
  if (existingEntity.created_at >= event.block.timestamp) return existingEntity;

  return newEntity;
}

export default getLatestSale;
