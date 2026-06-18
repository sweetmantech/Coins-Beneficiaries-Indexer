import {
  ZoraCreatorFactory,
  ZoraCreator1155,
  type ZoraCreatorFactory_SetupNewContract_event,
  type ZoraCreatorFactory_SetupNewContract_handlerArgs,
  type ZoraCreator1155_ContractMetadataUpdated_handlerArgs,
  type contractRegistrations,
} from "generated";
import { buildCollection } from "@/lib/zora_protocol/buildCollection";

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
    context.Zora_Collections.set(buildCollection(event));
  }
);

ZoraCreator1155.ContractMetadataUpdated.handler(
  async ({ event, context }: ZoraCreator1155_ContractMetadataUpdated_handlerArgs) => {
    const existing = await context.Zora_Collections.get(
      `${event.srcAddress.toLowerCase()}_${event.chainId}`
    );
    context.Zora_Collections.set({
      ...existing!,
      name: event.params.name,
      uri: event.params.uri,
      updated_at: event.block.timestamp,
    });
  }
);
