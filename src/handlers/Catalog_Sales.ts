import {
  USDCFixedPriceController,
  type Secondary_Sales,
  type USDCFixedPriceController_MintConfigurationUpdated_handlerArgs,
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
