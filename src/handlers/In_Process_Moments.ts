import { indexer, InProcessMoment, type InProcessMoment_SetupNewToken_handlerArgs, type InProcessMoment_URI_handlerArgs, type InProcessMoment_UpdatedRoyalties_handlerArgs } from "envio";
import { buildMoment } from "@/lib/zora_protocol/buildMoment";
import { handleUpdatedRoyalties } from "@/lib/zora_protocol/handleUpdatedRoyalties";
import { copyDownSecondarySale } from "@/lib/zora_protocol/copyDownSecondarySale";

indexer.onEvent(
  { contract: "InProcessMoment", event: "SetupNewToken" },
  async ({ event, context }: InProcessMoment_SetupNewToken_handlerArgs) => {
    const data = buildMoment(event);
    context.InProcess_Moments.set(data);
    await copyDownSecondarySale(data.id, data.token_id, data.collection, data.chain_id, context);
  }
);

indexer.onEvent(
  { contract: "InProcessMoment", event: "UpdatedRoyalties" },
  async ({ event, context }: InProcessMoment_UpdatedRoyalties_handlerArgs) =>
    handleUpdatedRoyalties(event, context)
);

indexer.onEvent(
  { contract: "InProcessMoment", event: "URI" },
  async ({ event, context }: InProcessMoment_URI_handlerArgs) => {
  const existing = await context.InProcess_Moments.get(
    `${event.srcAddress.toLowerCase()}_${event.params.id}_${event.chainId}`
  );
  if (!existing) return;
  context.InProcess_Moments.set({
    ...existing,
    updated_at: event.block.timestamp,
    uri: event.params.value,
  });
}
);
