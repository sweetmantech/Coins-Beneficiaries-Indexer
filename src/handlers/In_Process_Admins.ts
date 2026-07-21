import { indexer, InProcessMoment, type InProcess_Admins, type InProcessMoment_UpdatedPermissions_handlerArgs } from "envio";
import { FACTORY_ADDRESSES } from "@/lib/consts";

indexer.onEvent(
  { contract: "InProcessMoment", event: "UpdatedPermissions", eventFilters: [
      {
        permissions: BigInt(2),
      },
      {
        permissions: BigInt(0),
      },
    ], },
  async ({ event, context }: InProcessMoment_UpdatedPermissions_handlerArgs) => {
    if (FACTORY_ADDRESSES.includes(event.params.user.toLowerCase())) return;

    const entity: InProcess_Admins = {
      id: `${event.srcAddress.toLowerCase()}_${event.chainId}_${event.params.tokenId.toString()}_${event.params.user.toLowerCase()}`,
      collection: event.srcAddress.toLowerCase(),
      token_id: event.params.tokenId,
      admin: event.params.user.toLowerCase(),
      chain_id: event.chainId,
      permission: Number(event.params.permissions),
      updated_at: event.block.timestamp,
    };

    context.InProcess_Admins.set(entity);
  }
);
