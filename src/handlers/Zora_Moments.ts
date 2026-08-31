import {
  ZoraCreator1155,
  ZoraCreator1155Legacy,
  type ZoraCreator1155_SetupNewToken_handlerArgs,
  type ZoraCreator1155_URI_handlerArgs,
  type ZoraCreator1155Legacy_SetupNewToken_handlerArgs,
  type ZoraCreator1155Legacy_URI_handlerArgs,
} from "generated";
import { buildMoment } from "@/lib/zora_protocol/buildMoment";

ZoraCreator1155.SetupNewToken.handler(
  async ({ event, context }: ZoraCreator1155_SetupNewToken_handlerArgs) => {
    context.Zora_Moments.set(buildMoment(event));
  }
);

ZoraCreator1155Legacy.SetupNewToken.handler(
  async ({ event, context }: ZoraCreator1155Legacy_SetupNewToken_handlerArgs) => {
    context.Zora_Moments.set(buildMoment(event));
  }
);

ZoraCreator1155.URI.handler(async ({ event, context }: ZoraCreator1155_URI_handlerArgs) => {
  const id = `${event.srcAddress.toLowerCase()}_${event.params.id}_${event.chainId}`;
  const existing = await context.Zora_Moments.get(id);
  if (!existing) return;

  context.Zora_Moments.set({
    ...existing,
    uri: event.params.value,
    updated_at: event.block.timestamp,
  });
});

ZoraCreator1155Legacy.URI.handler(
  async ({ event, context }: ZoraCreator1155Legacy_URI_handlerArgs) => {
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
