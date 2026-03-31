import { decodeInitData } from "../../lib/sound_editions/decodeInitData";
import { getLatestAdmin } from "@/lib/sound_admins/getLatestAdmin";
import {
  SoundCreatorV2,
  type Sound_Editions,
  type Sound_Admins,
  type SoundCreatorV2_Created_handlerArgs,
  type contractRegistrations,
} from "generated";

const ADMIN_ROLE = 1;

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
  const owner = event.params.owner.toLowerCase();
  const { name, contractURI } = decodeInitData(event.params.initData as string);

  const edition: Sound_Editions = {
    id: `${address}_${event.chainId}`,
    address,
    name,
    owner,
    uri: contractURI,
    chain_id: event.chainId,
    created_at: event.block.timestamp,
    updated_at: event.block.timestamp,
    transaction_hash: event.transaction.hash,
  };
  context.Sound_Editions.set(edition);

  const adminEntity: Sound_Admins = {
    id: `${address}_${event.chainId}_0_${owner}`,
    collection: address,
    token_id: BigInt(0),
    admin: owner,
    roles: ADMIN_ROLE,
    chain_id: event.chainId,
    updated_at: event.block.timestamp,
  };
  const latestAdmin = await getLatestAdmin(adminEntity, context);
  context.Sound_Admins.set(latestAdmin);
});
