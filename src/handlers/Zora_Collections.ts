import {
  ZoraCreatorFactory,
  ZoraCreator1155,
  type Zora_Collections,
  type Secondary_Sales,
  type ZoraCreatorFactory_SetupNewContract_event,
  type ZoraCreatorFactory_SetupNewContract_handlerArgs,
  type ZoraCreator1155_ContractMetadataUpdated_handlerArgs,
  type contractRegistrations,
} from "generated";

ZoraCreatorFactory.SetupNewContract.contractRegister(
  ({
    event,
    context,
  }: {
    event: ZoraCreatorFactory_SetupNewContract_event;
    context: contractRegistrations;
  }) => {
    context.addZoraCreator1155(event.params.newContract);
  }
);

ZoraCreatorFactory.SetupNewContract.handler(
  async ({ event, context }: ZoraCreatorFactory_SetupNewContract_handlerArgs) => {
    const collection = event.params.newContract.toLowerCase();
    const entity: Zora_Collections = {
      id: `${collection}_${event.chainId}`,
      address: collection,
      name: event.params.name,
      uri: event.params.contractURI,
      default_admin: event.params.defaultAdmin.toLowerCase(),
      chain_id: event.chainId,
      created_at: event.block.timestamp,
      updated_at: event.block.timestamp,
      transaction_hash: event.transaction.hash,
    };
    context.Zora_Collections.set(entity);

    const secondarySale: Secondary_Sales = {
      id: `${collection}_0_${event.chainId}`,
      collection,
      token_id: 0n,
      royalty_recipient: event.params.defaultRoyaltyConfiguration[2].toLowerCase(),
      royalty_bps: Number(event.params.defaultRoyaltyConfiguration[1]),
      chain_id: event.chainId,
      updated_at: event.block.timestamp,
      transaction_hash: event.transaction.hash,
    };
    context.Secondary_Sales.set(secondarySale);
  }
);

ZoraCreator1155.ContractMetadataUpdated.handler(
  async ({ event, context }: ZoraCreator1155_ContractMetadataUpdated_handlerArgs) => {
    const existingEntity = await context.Zora_Collections.get(
      `${event.srcAddress.toLowerCase()}_${event.chainId}`
    );

    const entity: Zora_Collections = {
      ...existingEntity!,
      name: event.params.name,
      uri: event.params.uri,
      updated_at: event.block.timestamp,
    };
    context.Zora_Collections.set(entity);
  }
);
