import { indexer, InProcessCreatorFactory, InProcessMoment, type InProcessCreatorFactory_SetupNewContract_event, type InProcessCreatorFactory_SetupNewContract_handlerArgs, type InProcessMoment_ContractMetadataUpdated_handlerArgs, type contractRegistrations } from "envio";
import { buildCollection } from "@/lib/zora_protocol/buildCollection";
import { buildContractLevelSecondarySale } from "@/lib/zora_protocol/buildContractLevelSecondarySale";

indexer.contractRegister(
  { contract: "InProcessCreatorFactory", event: "SetupNewContract" },
  async ({
    event,
    context,
  }: {
    event: InProcessCreatorFactory_SetupNewContract_event;
    context: contractRegistrations;
  }) => {
    context.chain.InProcessMoment.add(event.params.newContract);
  }
);

indexer.onEvent(
  { contract: "InProcessCreatorFactory", event: "SetupNewContract" },
  async ({ event, context }: InProcessCreatorFactory_SetupNewContract_handlerArgs) => {
    const collection = event.params.newContract.toLowerCase();
    context.InProcess_Collections.set(buildCollection(event));
    context.Secondary_Sales.set(buildContractLevelSecondarySale(collection, event));
  }
);

indexer.onEvent(
  { contract: "InProcessMoment", event: "ContractMetadataUpdated" },
  async ({ event, context }: InProcessMoment_ContractMetadataUpdated_handlerArgs) => {
    const existing = await context.InProcess_Collections.get(
      `${event.srcAddress.toLowerCase()}_${event.chainId}`
    );
    context.InProcess_Collections.set({
      ...existing!,
      name: event.params.name,
      uri: event.params.uri,
      updated_at: event.block.timestamp,
    });
  }
);
