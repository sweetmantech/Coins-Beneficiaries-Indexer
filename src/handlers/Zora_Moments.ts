import { indexer, ZoraCreator1155, type ZoraCreator1155_SetupNewToken_handlerArgs, type ZoraCreator1155_URI_handlerArgs } from "envio";
import { buildMoment } from "@/lib/zora_protocol/buildMoment";

indexer.onEvent(
  { contract: "ZoraCreator1155", event: "SetupNewToken" },
  async ({ event, context }: ZoraCreator1155_SetupNewToken_handlerArgs) => {
    context.Zora_Moments.set(buildMoment(event));
  }
);

indexer.onEvent(
  { contract: "ZoraCreator1155", event: "URI" },
  async ({ event, context }: ZoraCreator1155_URI_handlerArgs) => {
  const id = `${event.srcAddress.toLowerCase()}_${event.params.id}_${event.chainId}`;
  const existing = await context.Zora_Moments.get(id);
  if (!existing) return;

  context.Zora_Moments.set({
    ...existing,
    uri: event.params.value,
    updated_at: event.block.timestamp,
  });
}
);
