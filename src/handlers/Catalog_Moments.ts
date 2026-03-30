import {
  CatalogRelease1155,
  type Catalog_Moments,
  type CatalogRelease1155_TokenCreated_handlerArgs,
} from "generated";

CatalogRelease1155.TokenCreated.handler(
  async ({ event, context }: CatalogRelease1155_TokenCreated_handlerArgs) => {
    const collection = event.srcAddress.toLowerCase();
    const entity: Catalog_Moments = {
      id: `${collection}_${event.params._tokenId}_${event.chainId}`,
      collection,
      token_id: event.params._tokenId,
      artist: event.params._artist.toLowerCase(),
      uri: event.params._uri,
      chain_id: event.chainId,
      created_at: event.block.timestamp,
      updated_at: event.block.timestamp,
      transaction_hash: event.transaction.hash,
    };
    context.Catalog_Moments.set(entity);
  }
);
