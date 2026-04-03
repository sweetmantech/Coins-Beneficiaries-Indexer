import {
  SoundMetadata,
  SoundEditionV2_1,
  type Sound_Moments,
  type SoundMetadata_BaseURISet_handlerArgs,
  type SoundEditionV2_1_TierCreated_handlerArgs,
} from "generated";

SoundMetadata.BaseURISet.handler(
  async ({ event, context }: SoundMetadata_BaseURISet_handlerArgs) => {
    const edition = event.params.edition.toLowerCase();
    const tier = Number(event.params.tier);
    const id = `${edition}_${tier}_${event.chainId}`;

    const existing = await context.Sound_Moments.get(id);

    const soundMoment: Sound_Moments = {
      id,
      collection: edition,
      tier,
      uri: `${event.params.uri}/${tier}`,
      uri_from_metadata: true,
      chain_id: event.chainId,
      created_at: existing?.created_at ?? event.block.timestamp,
      updated_at: event.block.timestamp,
      transaction_hash: event.transaction.hash,
    };
    context.Sound_Moments.set(soundMoment);
  }
);

SoundEditionV2_1.TierCreated.handler(
  async ({ event, context }: SoundEditionV2_1_TierCreated_handlerArgs) => {
    const edition = event.srcAddress.toLowerCase();
    const tier = Number(event.params.creation[0]);
    const id = `${edition}_${tier}_${event.chainId}`;

    // Don't overwrite if SoundMetadata.BaseURISet already populated this row
    const existing = await context.Sound_Moments.get(id);
    if (existing) return;

    const editionId = `${edition}_${event.chainId}`;
    const editionRecord = await context.Sound_Editions.get(editionId);

    const soundMoment: Sound_Moments = {
      id,
      collection: edition,
      tier,
      uri: `${editionRecord?.base_uri ?? ""}/${tier}`,
      uri_from_metadata: false,
      chain_id: event.chainId,
      created_at: event.block.timestamp,
      updated_at: event.block.timestamp,
      transaction_hash: event.transaction.hash,
    };
    context.Sound_Moments.set(soundMoment);
  }
);
