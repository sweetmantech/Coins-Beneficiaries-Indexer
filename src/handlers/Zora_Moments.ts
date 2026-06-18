import {
  ZoraCreator1155,
  type ZoraCreator1155_SetupNewToken_handlerArgs,
  type ZoraCreator1155_URI_handlerArgs,
  type ZoraCreator1155_UpdatedRoyalties_handlerArgs,
} from "generated";
import { buildMoment } from "@/lib/zora_protocol/buildMoment";
import { handleUpdatedRoyalties } from "@/lib/zora_protocol/handleUpdatedRoyalties";
import { copyDownSecondarySale } from "@/lib/zora_protocol/copyDownSecondarySale";

ZoraCreator1155.SetupNewToken.handler(
  async ({ event, context }: ZoraCreator1155_SetupNewToken_handlerArgs) => {
    const data = buildMoment(event);
    context.Zora_Moments.set(data);
    await copyDownSecondarySale(data.id, data.token_id, data.collection, data.chain_id, context);
  }
);

ZoraCreator1155.UpdatedRoyalties.handler(
  async ({ event, context }: ZoraCreator1155_UpdatedRoyalties_handlerArgs) =>
    handleUpdatedRoyalties(event, context)
);

ZoraCreator1155.URI.handler(async ({ event, context }: ZoraCreator1155_URI_handlerArgs) => {
  const existing = await context.Zora_Moments.get(
    `${event.srcAddress.toLowerCase()}_${event.params.id}_${event.chainId}`
  );
  if (!existing) return;
  context.Zora_Moments.set({
    ...existing,
    updated_at: event.block.timestamp,
    uri: event.params.value,
  });
});
