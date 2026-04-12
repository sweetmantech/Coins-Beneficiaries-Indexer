import {
  InProcessCreatorFactory,
  InProcessMoment,
  type InProcess_Collections,
  type Secondary_Sales,
  type InProcessCreatorFactory_SetupNewContract_event,
  type InProcessCreatorFactory_SetupNewContract_handlerArgs,
  type InProcessMoment_ContractMetadataUpdated_handlerArgs,
  type contractRegistrations,
} from "generated";
import getValidateExistingEntity from "@/lib/in_process_collections/getValidateExistingEntity";

// Register ERC1155 contracts dynamically when they're created by the factory
InProcessCreatorFactory.SetupNewContract.contractRegister(
  ({
    event,
    context,
  }: {
    event: InProcessCreatorFactory_SetupNewContract_event;
    context: contractRegistrations;
  }) => {
    // Register the new ERC1155 contract using its address from the event
    context.addInProcessMoment(event.params.newContract);
  }
);

InProcessCreatorFactory.SetupNewContract.handler(
  async ({ event, context }: InProcessCreatorFactory_SetupNewContract_handlerArgs) => {
    const collection = event.params.newContract.toLowerCase();
    const entity: InProcess_Collections = {
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
    context.InProcess_Collections.set(entity);

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

InProcessMoment.ContractMetadataUpdated.handler(
  async ({ event, context }: InProcessMoment_ContractMetadataUpdated_handlerArgs) => {
    if (event.params.uri === "") return;

    const existingEntity = await getValidateExistingEntity(event, context);

    if (!existingEntity) {
      return;
    }

    const entity: InProcess_Collections = {
      ...existingEntity,
      name: event.params.name,
      uri: event.params.uri,
      updated_at: event.block.timestamp,
    };
    context.InProcess_Collections.set(entity);
  }
);
