import {
  USDCFixedPriceController,
  type USDCFixedPriceController_AlbumMintConfigurationUpdated_handlerArgs,
  type Catalog_Albums,
} from "generated";

USDCFixedPriceController.AlbumMintConfigurationUpdated.handler(
  async ({
    event,
    context,
  }: USDCFixedPriceController_AlbumMintConfigurationUpdated_handlerArgs) => {
    const [, , tokenIds] = event.params.configuration;

    const albumEntity: Catalog_Albums = {
      id: `${event.params.releaseContract.toLowerCase()}_${event.params.albumId.toString()}_${event.chainId}`,
      collection: event.params.releaseContract.toLowerCase(),
      album_id: event.params.albumId,
      token_ids: JSON.stringify(tokenIds.map((id: bigint) => id.toString())),
      chain_id: event.chainId,
    };

    context.Catalog_Albums.set(albumEntity);
  }
);
