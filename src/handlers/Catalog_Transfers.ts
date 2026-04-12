import {
  CatalogRelease1155,
  type CatalogRelease1155_TokenPurchased_handlerArgs,
  type CatalogRelease1155_AlbumPurchased_handlerArgs,
  type CatalogRelease1155_TokenMinted_handlerArgs,
  type Transfers,
} from "generated";

CatalogRelease1155.TokenPurchased.handler(
  async ({ event, context }: CatalogRelease1155_TokenPurchased_handlerArgs) => {
    const entity: Transfers = {
      id: `${event.srcAddress.toLowerCase()}_${event.params.tokenId.toString()}_${event.chainId}_${event.block.number}_${event.logIndex}`,
      collection: event.srcAddress.toLowerCase(),
      token_id: event.params.tokenId,
      chain_id: event.chainId,
      recipient: event.params.buyer.toLowerCase(),
      quantity: event.params.amount,
      value: undefined,
      currency: undefined,
      transaction_hash: event.transaction.hash,
      block_number: BigInt(event.block.number),
      transferred_at: event.block.timestamp,
    };
    context.Transfers.set(entity);
  }
);

CatalogRelease1155.AlbumPurchased.handler(
  async ({ event, context }: CatalogRelease1155_AlbumPurchased_handlerArgs) => {
    const albumId = `${event.srcAddress.toLowerCase()}_${event.params.albumId.toString()}_${event.chainId}`;
    const albumRecord = await context.Catalog_Albums.get(albumId);

    if (!albumRecord) return;

    const tokenIds: bigint[] = (JSON.parse(albumRecord.token_ids) as string[]).map((id) =>
      BigInt(id)
    );

    for (const tokenId of tokenIds) {
      context.Transfers.set({
        id: `${event.srcAddress.toLowerCase()}_${tokenId.toString()}_${event.chainId}_${event.block.number}_${event.logIndex}`,
        collection: event.srcAddress.toLowerCase(),
        token_id: tokenId,
        chain_id: event.chainId,
        recipient: event.params.buyer.toLowerCase(),
        quantity: 1n,
        value: undefined,
        currency: undefined,
        transaction_hash: event.transaction.hash,
        block_number: BigInt(event.block.number),
        transferred_at: event.block.timestamp,
      });
    }
  }
);

// Admin mint (airdrop) — triggered by mintTokenAdmin(), no payment involved
CatalogRelease1155.TokenMinted.handler(
  async ({ event, context }: CatalogRelease1155_TokenMinted_handlerArgs) => {
    const entity: Transfers = {
      id: `${event.srcAddress.toLowerCase()}_${event.params.tokenId.toString()}_${event.chainId}_${event.block.number}_${event.logIndex}`,
      collection: event.srcAddress.toLowerCase(),
      token_id: event.params.tokenId,
      chain_id: event.chainId,
      recipient: event.params.artist.toLowerCase(),
      quantity: event.params.amount,
      value: undefined,
      currency: undefined,
      transaction_hash: event.transaction.hash,
      block_number: BigInt(event.block.number),
      transferred_at: event.block.timestamp,
    };
    context.Transfers.set(entity);
  }
);
