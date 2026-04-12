import { decodeInitData } from "../../lib/sound_editions/decodeInitData";
import { SOUND_ADMIN_ROLE } from "@/lib/consts";
import {
  SoundCreatorV2,
  SoundEditionV2_1,
  type Sound_Editions,
  type Sound_Admins,
  type Secondary_Sales,
  type SoundCreatorV2_Created_handlerArgs,
  type SoundEditionV2_1_ContractURISet_handlerArgs,
  type SoundEditionV2_1_BaseURISet_handlerArgs,
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
  const owner = event.params.owner.toLowerCase();
  const { name, baseURI, contractURI, fundingRecipient, royaltyBPS } = decodeInitData(
    event.params.initData as string
  );

  const edition: Sound_Editions = {
    id: `${address}_${event.chainId}`,
    address,
    name,
    owner,
    uri: contractURI,
    base_uri: baseURI,
    funding_recipient: fundingRecipient,
    royalty_bps: royaltyBPS,
    chain_id: event.chainId,
    created_at: event.block.timestamp,
    updated_at: event.block.timestamp,
    transaction_hash: event.transaction.hash,
  };
  context.Sound_Editions.set(edition);

  // Initialize Secondary_Sales at edition level (token_id=0 = edition-wide)
  const secondarySale: Secondary_Sales = {
    id: `${address}_0_${event.chainId}`,
    collection: address,
    token_id: BigInt(0),
    royalty_recipient: fundingRecipient,
    royalty_bps: royaltyBPS,
    chain_id: event.chainId,
    updated_at: event.block.timestamp,
    transaction_hash: event.transaction.hash,
  };
  context.Secondary_Sales.set(secondarySale);

  const adminEntity: Sound_Admins = {
    id: `${address}_${event.chainId}_0_${owner}`,
    collection: address,
    token_id: BigInt(0),
    admin: owner,
    roles: SOUND_ADMIN_ROLE,
    chain_id: event.chainId,
    updated_at: event.block.timestamp,
  };
  context.Sound_Admins.set(adminEntity);
});

SoundEditionV2_1.ContractURISet.handler(
  async ({ event, context }: SoundEditionV2_1_ContractURISet_handlerArgs) => {
    const address = event.srcAddress.toLowerCase();
    const id = `${address}_${event.chainId}`;
    const existing = await context.Sound_Editions.get(id);
    if (!existing) return;

    context.Sound_Editions.set({
      ...existing,
      uri: event.params.contractURI,
      updated_at: event.block.timestamp,
      transaction_hash: event.transaction.hash,
    });
  }
);

SoundEditionV2_1.BaseURISet.handler(
  async ({ event, context }: SoundEditionV2_1_BaseURISet_handlerArgs) => {
    const address = event.srcAddress.toLowerCase();
    const id = `${address}_${event.chainId}`;
    const existing = await context.Sound_Editions.get(id);
    if (!existing) return;

    const newBaseURI = event.params.baseURI;

    context.Sound_Editions.set({
      ...existing,
      base_uri: newBaseURI,
      updated_at: event.block.timestamp,
      transaction_hash: event.transaction.hash,
    });

    // Update Sound_Moments that were set from edition baseURI (not SoundMetadata)
    const moments = await context.Sound_Moments.getWhere.collection.eq(address);
    for (const moment of moments) {
      if (moment.chain_id !== event.chainId || moment.uri_from_metadata) continue;

      context.Sound_Moments.set({
        ...moment,
        uri: `${newBaseURI}/${moment.tier}`,
        updated_at: event.block.timestamp,
        transaction_hash: event.transaction.hash,
      });
    }
  }
);
