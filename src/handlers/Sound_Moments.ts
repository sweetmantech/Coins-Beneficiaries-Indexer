import {
  SoundMetadata,
  type Sound_Moments,
  type SoundMetadata_BaseURISet_handlerArgs,
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
      chain_id: event.chainId,
      created_at: existing?.created_at ?? event.block.timestamp,
      updated_at: event.block.timestamp,
      transaction_hash: event.transaction.hash,
    };
    context.Sound_Moments.set(soundMoment);
  }
);
