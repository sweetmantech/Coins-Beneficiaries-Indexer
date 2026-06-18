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
  const id = `${event.srcAddress.toLowerCase()}_${event.params.id}_${event.chainId}`;
  const existing = await context.Zora_Moments.get(id);

  context.Zora_Moments.set({
    id,
    collection: event.srcAddress.toLowerCase(),
    token_id: event.params.id,
    chain_id: event.chainId,
    transaction_hash: event.transaction.hash,
    created_at: existing?.created_at,
    max_supply: existing?.max_supply,
    uri: event.params.value,
    updated_at: event.block.timestamp,
  });
});
