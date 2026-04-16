import {
  ZoraMedia,
  type Transfers,
  type ZoraMedia_Admins,
  type ZoraMedia_Moments,
  type ZoraMedia_Transfer_handlerArgs,
  type ZoraMedia_TokenURIUpdated_handlerArgs,
  type ZoraMedia_TokenMetadataURIUpdated_handlerArgs,
} from "generated";
import { zeroAddress } from "viem";
import getInitialUrisFromCalldata from "@/lib/zora_media/getInitialUrisFromCalldata";

ZoraMedia.Transfer.handler(
  async ({ event, context }: ZoraMedia_Transfer_handlerArgs) => {
    const collection = event.srcAddress.toLowerCase();
    const tokenId = event.params.tokenId;
    if (tokenId === 0n) return;
    const admin = event.params.to.toLowerCase();
    const txInput = (event.transaction as { input?: string }).input ?? "0x";
    const decodedUris = getInitialUrisFromCalldata(txInput);

    const entity: ZoraMedia_Moments = {
      id: `${collection}_${tokenId}_${event.chainId}`,
      collection,
      token_id: tokenId,
      owner: admin,
      uri: decodedUris?.tokenURI,
      metadata_uri: decodedUris?.metadataURI,
      chain_id: event.chainId,
      created_at: event.block.timestamp,
      updated_at: event.block.timestamp,
      transaction_hash: event.transaction.hash,
    };

    context.ZoraMedia_Moments.set(entity);
    context.Transfers.set({
      id: `${collection}_${tokenId}_${event.chainId}_${event.block.number}_${event.logIndex}`,
      collection,
      token_id: tokenId,
      chain_id: event.chainId,
      recipient: admin,
      quantity: 1n,
      value: undefined,
      currency: undefined,
      transaction_hash: event.transaction.hash,
      block_number: BigInt(event.block.number),
      transferred_at: event.block.timestamp,
    } as Transfers);

    const adminEntity: ZoraMedia_Admins = {
      id: `${collection}_${event.chainId}_${tokenId}_${admin}`,
      admin,
      collection,
      token_id: tokenId,
      chain_id: event.chainId,
      updated_at: event.block.timestamp,
    };

    context.ZoraMedia_Admins.set(adminEntity);
  },
  { eventFilters: [{ from: zeroAddress }] }
);

ZoraMedia.TokenURIUpdated.handler(
  async ({ event, context }: ZoraMedia_TokenURIUpdated_handlerArgs) => {
    const collection = event.srcAddress.toLowerCase();
    const tokenId = event.params._tokenId;
    if (tokenId === 0n) return;
    const id = `${collection}_${tokenId}_${event.chainId}`;
    const existingEntity = await context.ZoraMedia_Moments.get(id);

    const entity: ZoraMedia_Moments = {
      id,
      collection,
      token_id: tokenId,
      owner: event.params.owner.toLowerCase(),
      uri: event.params._uri,
      metadata_uri: existingEntity?.metadata_uri,
      chain_id: event.chainId,
      created_at: existingEntity?.created_at ?? event.block.timestamp,
      updated_at: event.block.timestamp,
      transaction_hash: existingEntity?.transaction_hash ?? event.transaction.hash,
    };

    context.ZoraMedia_Moments.set(entity);
  }
);

ZoraMedia.TokenMetadataURIUpdated.handler(
  async ({ event, context }: ZoraMedia_TokenMetadataURIUpdated_handlerArgs) => {
    const collection = event.srcAddress.toLowerCase();
    const tokenId = event.params._tokenId;
    if (tokenId === 0n) return;
    const id = `${collection}_${tokenId}_${event.chainId}`;
    const existingEntity = await context.ZoraMedia_Moments.get(id);

    const entity: ZoraMedia_Moments = {
      id,
      collection,
      token_id: tokenId,
      owner: event.params.owner.toLowerCase(),
      uri: existingEntity?.uri,
      metadata_uri: event.params._uri,
      chain_id: event.chainId,
      created_at: existingEntity?.created_at ?? event.block.timestamp,
      updated_at: event.block.timestamp,
      transaction_hash: existingEntity?.transaction_hash ?? event.transaction.hash,
    };

    context.ZoraMedia_Moments.set(entity);
  }
);
