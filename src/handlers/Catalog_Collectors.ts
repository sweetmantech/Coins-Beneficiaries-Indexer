import {
  CatalogRelease1155,
  USDCFixedPriceController,
  type CatalogRelease1155_TokenPurchased_handlerArgs,
  type CatalogRelease1155_AlbumPurchased_handlerArgs,
  type USDCFixedPriceController_AlbumMintConfigurationUpdated_handlerArgs,
  type Catalog_Albums,
  type Collectors,
  type Payments,
} from "generated";
import getUsdcTransfer from "@/lib/catalog_payments/getUsdcTransfer";
import formatUnits from "@/lib/formatUnits";
import { USDC_ADDRESSES } from "@/lib/consts";
import { zeroAddress } from "viem";

CatalogRelease1155.TokenPurchased.handler(
  async ({ event, context }: CatalogRelease1155_TokenPurchased_handlerArgs) => {
    const collectEntity: Collectors = {
      id: `${event.srcAddress.toLowerCase()}_${event.params.tokenId.toString()}_${event.chainId}_${event.block.number}_${event.logIndex}`,
      collection: event.srcAddress.toLowerCase(),
      token_id: event.params.tokenId,
      amount: event.params.amount,
      chain_id: event.chainId,
      collector: event.params.buyer.toLowerCase(),
      transaction_hash: event.transaction.hash,
      collected_at: event.block.timestamp,
    };

    context.Collectors.set(collectEntity);

    const collection = event.srcAddress.toLowerCase();
    const payout = await getUsdcTransfer(event, context);

    if (!payout) return;

    const paymentEntity: Payments = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      collection,
      currency: USDC_ADDRESSES[event.chainId] ?? zeroAddress,
      token_id: event.params.tokenId,
      spender: event.params.buyer.toLowerCase(),
      recipient: payout.recipient.toLowerCase(),
      amount: payout.amount,
      chain_id: event.chainId,
      transaction_hash: event.transaction.hash,
      transferred_at: event.block.timestamp,
    };

    context.Payments.set(paymentEntity);
  }
);

// USDCFixedPriceController.AlbumMintConfigurationUpdated.handler(
//   async ({
//     event,
//     context,
//   }: USDCFixedPriceController_AlbumMintConfigurationUpdated_handlerArgs) => {
//     const [albumPrice, fundsRecipient, tokenIds] = event.params.configuration;

//     const albumEntity: Catalog_Albums = {
//       id: `${event.params.releaseContract.toLowerCase()}_${event.params.albumId.toString()}_${event.chainId}`,
//       collection: event.params.releaseContract.toLowerCase(),
//       album_id: event.params.albumId,
//       token_ids: JSON.stringify(tokenIds.map((id: bigint) => id.toString())),
//       funds_recipient: fundsRecipient.toLowerCase(),
//       album_price: albumPrice,
//       chain_id: event.chainId,
//     };

//     context.Catalog_Albums.set(albumEntity);
//   }
// );

// CatalogRelease1155.AlbumPurchased.handler(
//   async ({ event, context }: CatalogRelease1155_AlbumPurchased_handlerArgs) => {
//     const albumId = `${event.srcAddress.toLowerCase()}_${event.params.albumId.toString()}_${event.chainId}`;
//     const albumRecord = await context.Catalog_Albums.get(albumId);

//     if (!albumRecord) return;

//     const tokenIds: bigint[] = (JSON.parse(albumRecord.token_ids) as string[]).map((id) =>
//       BigInt(id)
//     );

//     for (const tokenId of tokenIds) {
//       context.Collectors.set({
//         id: `${event.srcAddress.toLowerCase()}_${tokenId.toString()}_${event.chainId}_${event.block.number}_${event.logIndex}`,
//         collection: event.srcAddress.toLowerCase(),
//         token_id: tokenId,
//         amount: BigInt(1),
//         chain_id: event.chainId,
//         collector: event.params.buyer.toLowerCase(),
//         transaction_hash: event.transaction.hash,
//         collected_at: event.block.timestamp,
//       });
//     }

//     const recipient = albumRecord.funds_recipient;
//     const amountPerToken = formatUnits(albumRecord.album_price / BigInt(tokenIds.length), 6);

//     if (amountPerToken === "0.000000" || recipient === zeroAddress) return;

//     for (const tokenId of tokenIds) {
//       context.Payments.set({
//         id: `${event.chainId}_${event.block.number}_${event.logIndex}_${tokenId.toString()}`,
//         collection: event.srcAddress.toLowerCase(),
//         currency: USDC_ADDRESSES[event.chainId] ?? zeroAddress,
//         token_id: tokenId,
//         spender: event.params.buyer.toLowerCase(),
//         recipient: recipient.toLowerCase(),
//         amount: amountPerToken,
//         chain_id: event.chainId,
//         transaction_hash: event.transaction.hash,
//         transferred_at: event.block.timestamp,
//       });
//     }
//   }
// );
