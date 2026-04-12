import {
  USDCFixedPriceController,
  USDCFixedPriceController_AlbumMintConfigurationUpdated_handlerArgs,
  type Secondary_Sales,
  type USDCFixedPriceController_MintConfigurationUpdated_handlerArgs,
  type Catalog_Albums,
} from "generated";
import getLatestSale from "@/lib/catalog_sales/getLatestSale";

USDCFixedPriceController.MintConfigurationUpdated.handler(
  async ({ event, context }: USDCFixedPriceController_MintConfigurationUpdated_handlerArgs) => {
    const latestSale = await getLatestSale(event, context);
    context.Primary_Sales.set(latestSale);

    const collection = event.params.releaseContract.toLowerCase();
    const tokenId = event.params.tokenId;
    const secondarySale: Secondary_Sales = {
      id: `${collection}_${tokenId}_${event.chainId}`,
      collection,
      token_id: tokenId,
      royalty_recipient: event.params.configuration[1].toLowerCase(),
      royalty_bps: 1000,
      chain_id: event.chainId,
      updated_at: event.block.timestamp,
      transaction_hash: event.transaction.hash,
    };
    context.Secondary_Sales.set(secondarySale);
  }
);

USDCFixedPriceController.AlbumMintConfigurationUpdated.handler(
  async ({
    event,
    context,
  }: USDCFixedPriceController_AlbumMintConfigurationUpdated_handlerArgs) => {
    const [albumPrice, fundsRecipient, tokenIds] = event.params.configuration;

    const albumEntity: Catalog_Albums = {
      id: `${event.params.releaseContract.toLowerCase()}_${event.params.albumId.toString()}_${event.chainId}`,
      collection: event.params.releaseContract.toLowerCase(),
      album_id: event.params.albumId,
      token_ids: JSON.stringify(tokenIds.map((id: bigint) => id.toString())),
      funds_recipient: fundsRecipient.toLowerCase(),
      album_price: albumPrice,
      chain_id: event.chainId,
    };

    context.Catalog_Albums.set(albumEntity);
  }
);
