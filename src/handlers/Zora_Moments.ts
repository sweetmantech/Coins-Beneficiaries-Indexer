import {
  ZoraCreator1155,
  type ZoraCreator1155_SetupNewToken_handlerArgs,
  type ZoraCreator1155_URI_handlerArgs,
} from "generated";
import { buildMoment } from "@/lib/zora_protocol/buildMoment";

ZoraCreator1155.SetupNewToken.handler(
  async ({ event, context }: ZoraCreator1155_SetupNewToken_handlerArgs) => {
    context.Zora_Moments.set(buildMoment(event));
  }
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
