import { indexer, ZoraCreatorFactory, ZoraCreator1155, type ZoraCreatorFactory_SetupNewContract_event, type ZoraCreatorFactory_SetupNewContract_handlerArgs, type ZoraCreator1155_ContractMetadataUpdated_handlerArgs, type contractRegistrations } from "envio";
import { buildCollection } from "@/lib/zora_protocol/buildCollection";

indexer.contractRegister(
  { contract: "ZoraCreatorFactory", event: "SetupNewContract" },
  async ({
    event,
    context,
  }: {
    event: ZoraCreatorFactory_SetupNewContract_event;
    context: contractRegistrations;
  }) => {
    context.chain.ZoraCreator1155.add(event.params.newContract);
  }
);

indexer.onEvent(
  { contract: "ZoraCreatorFactory", event: "SetupNewContract" },
  async ({ event, context }: ZoraCreatorFactory_SetupNewContract_handlerArgs) => {
    context.Zora_Collections.set(buildCollection(event));
  }
);

indexer.onEvent(
  { contract: "ZoraCreator1155", event: "ContractMetadataUpdated" },
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
