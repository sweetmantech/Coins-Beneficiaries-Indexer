import {
  InProcessMoment,
  type InProcess_Moments,
  type Secondary_Sales,
  type InProcessMoment_SetupNewToken_handlerArgs,
  type InProcessMoment_URI_handlerArgs,
  type InProcessMoment_UpdatedRoyalties_handlerArgs,
} from "generated";
import getValidateExistingEntity from "@/lib/in_process_moments/getValidateExistingEntity";

InProcessMoment.SetupNewToken.handler(
  async ({ event, context }: InProcessMoment_SetupNewToken_handlerArgs) => {
    const collection = event.srcAddress.toLowerCase();
    const chainId = event.chainId;
    const tokenId = event.params.tokenId;
    const entityId = `${collection}_${tokenId}_${chainId}`;
    const entity: InProcess_Moments = {
      id: entityId,
      collection,
      token_id: tokenId,
      max_supply: event.params.maxSupply,
      uri: event.params.newURI,
      chain_id: event.chainId,
      created_at: event.block.timestamp,
      updated_at: event.block.timestamp,
      transaction_hash: event.transaction.hash,
    };
    context.InProcess_Moments.set(entity);

    const contractBase = await context.Secondary_Sales.get(`${collection}_0_${chainId}`);
    if (contractBase) {
      const existingTokenSale = await context.Secondary_Sales.get(entityId);
      if (!existingTokenSale) {
        const secondarySale: Secondary_Sales = {
          ...contractBase,
          id: entityId,
          token_id: tokenId,
        };
        context.Secondary_Sales.set(secondarySale);
      }
    }
  }
);

InProcessMoment.UpdatedRoyalties.handler(
  async ({ event, context }: InProcessMoment_UpdatedRoyalties_handlerArgs) => {
    const collection = event.srcAddress.toLowerCase();
    const tokenId = event.params.tokenId;
    const id = `${collection}_${tokenId}_${event.chainId}`;

    const secondarySale: Secondary_Sales = {
      id,
      collection,
      token_id: tokenId,
      royalty_recipient: event.params.configuration[2].toLowerCase(),
      royalty_bps: Number(event.params.configuration[1]),
      chain_id: event.chainId,
      updated_at: event.block.timestamp,
      transaction_hash: event.transaction.hash,
    };
    context.Secondary_Sales.set(secondarySale);
  }
);

InProcessMoment.URI.handler(async ({ event, context }: InProcessMoment_URI_handlerArgs) => {
  const existingEntity = await getValidateExistingEntity(event, context);

  if (!existingEntity) return;

  const entity: InProcess_Moments = {
    ...existingEntity,
    updated_at: event.block.timestamp,
    uri: event.params.value,
  };
  context.InProcess_Moments.set(entity);
});
