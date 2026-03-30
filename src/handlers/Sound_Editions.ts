import { decodeInitData } from "../../lib/sound_editions/decodeInitData";
import {
  SoundCreatorV2,
  type Sound_Editions,
  type SoundCreatorV2_Created_handlerArgs,
  type contractRegistrations,
} from "generated";

SoundCreatorV2.Created.contractRegister(
  ({
    event,
    context,
  }: {
    event: { params: { edition: string } };
    context: contractRegistrations;
  }) => {
    context.addSoundEditionV2_1(event.params.edition);
  }
);

SoundCreatorV2.Created.handler(async ({ event, context }: SoundCreatorV2_Created_handlerArgs) => {
  const address = event.params.edition.toLowerCase();
  const { name, contractURI } = decodeInitData(event.params.initData as string);
  const entity: Sound_Editions = {
    id: `${address}_${event.chainId}`,
    address,
    name,
    owner: event.params.owner.toLowerCase(),
    uri: contractURI,
    chain_id: event.chainId,
    created_at: event.block.timestamp,
    updated_at: event.block.timestamp,
    transaction_hash: event.transaction.hash,
  };
  context.Sound_Editions.set(entity);
});
