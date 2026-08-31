import {
  InPublic1155,
  type InPublic1155_SetupNewToken_handlerArgs,
  type InPublic1155_URI_handlerArgs,
} from "generated";
import { buildMoment } from "@/lib/zora_protocol/buildMoment";

InPublic1155.SetupNewToken.handler(
  async ({ event, context }: InPublic1155_SetupNewToken_handlerArgs) => {
    context.Zora_Moments.set(buildMoment(event));
  }
);

InPublic1155.URI.handler(async ({ event, context }: InPublic1155_URI_handlerArgs) => {
  const id = `${event.srcAddress.toLowerCase()}_${event.params.id}_${event.chainId}`;
  const existing = await context.Zora_Moments.get(id);
  if (!existing) return;

  context.Zora_Moments.set({
    ...existing,
    uri: event.params.value,
    updated_at: event.block.timestamp,
  });
});
