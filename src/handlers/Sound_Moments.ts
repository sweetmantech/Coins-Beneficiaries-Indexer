import {
  SoundEditionV2_1,
  SoundMetadata,
  type Sound_Tiers,
  type Sound_Moments,
  type SoundEditionV2_1_Minted_handlerArgs,
  type SoundMetadata_BaseURISet_handlerArgs,
} from "generated";

// Sound_Tiers stores the base URI per tier (from SoundMetadata) and a running quantity
// used to compute each token's tier-relative index.
// Full token URI = tier.uri + (quantity + i + 1)
// ArweaveURILib already appends a trailing slash: "ar://...hash/"
SoundMetadata.BaseURISet.handler(
  async ({ event, context }: SoundMetadata_BaseURISet_handlerArgs) => {
    const edition = event.params.edition.toLowerCase();
    const tier = Number(event.params.tier);
    const tierId = `${edition}_${tier}_${event.chainId}`;

    const existing = await context.Sound_Tiers.get(tierId);

    const soundTier: Sound_Tiers = {
      id: tierId,
      collection: edition,
      tier,
      uri: event.params.uri,
      quantity: existing?.quantity ?? 0n,
      chain_id: event.chainId,
      updated_at: event.block.timestamp,
      transaction_hash: event.transaction.hash,
    };
    context.Sound_Tiers.set(soundTier);
  }
);

// One Sound_Moments row per ERC721A tokenId.
// Minted covers a batch: tokenIds fromTokenId … fromTokenId + quantity - 1.
// URI = baseURI + (tier-relative 1-indexed position)
SoundEditionV2_1.Minted.handler(async ({ event, context }: SoundEditionV2_1_Minted_handlerArgs) => {
  const edition = event.srcAddress.toLowerCase();
  const tier = Number(event.params.tier);
  const quantity = BigInt(event.params.quantity);
  const fromTokenId = BigInt(event.params.fromTokenId);
  const tierId = `${edition}_${tier}_${event.chainId}`;

  const tierRow = await context.Sound_Tiers.get(tierId);
  const baseUri = tierRow?.uri ?? "";
  const mintedSoFar = tierRow?.quantity ?? 0n;

  for (let i = 0n; i < quantity; i++) {
    const tokenId = fromTokenId + i;
    const tierIndex = mintedSoFar + i + 1n; // 1-indexed position within tier
    const moment: Sound_Moments = {
      id: `${edition}_${tokenId}_${event.chainId}`,
      collection: edition,
      token_id: tokenId,
      uri: baseUri ? `${baseUri}/${tierIndex}` : "",
      chain_id: event.chainId,
      created_at: event.block.timestamp,
      updated_at: event.block.timestamp,
      transaction_hash: event.transaction.hash,
    };
    context.Sound_Moments.set(moment);
  }

  // Update tier quantity
  context.Sound_Tiers.set({
    id: tierId,
    collection: edition,
    tier,
    uri: baseUri,
    quantity: mintedSoFar + quantity,
    chain_id: event.chainId,
    updated_at: event.block.timestamp,
    transaction_hash: event.transaction.hash,
  });
});
