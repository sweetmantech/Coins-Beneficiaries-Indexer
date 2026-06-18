import {
  ZoraCreator1155,
  type Zora_Admins,
  type ZoraCreator1155_UpdatedPermissions_handlerArgs,
} from "generated";
import { FACTORY_ADDRESSES } from "@/lib/consts";

ZoraCreator1155.UpdatedPermissions.handler(
  async ({ event, context }: ZoraCreator1155_UpdatedPermissions_handlerArgs) => {
    if (FACTORY_ADDRESSES.includes(event.params.user.toLowerCase())) return;

    const entity: Zora_Admins = {
      id: `${event.srcAddress.toLowerCase()}_${event.chainId}_${event.params.tokenId.toString()}_${event.params.user.toLowerCase()}`,
      collection: event.srcAddress.toLowerCase(),
      token_id: event.params.tokenId,
      admin: event.params.user.toLowerCase(),
      chain_id: event.chainId,
      permission: Number(event.params.permissions),
      updated_at: event.block.timestamp,
    };

    context.Zora_Admins.set(entity);
  },
  {
    eventFilters: [
      {
        permissions: BigInt(2),
      },
      {
        permissions: BigInt(0),
      },
    ],
  }
);
