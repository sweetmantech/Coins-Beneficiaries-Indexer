import {
  SoundEditionV2_1,
  type Sound_Admins,
  type SoundEditionV2_1_RolesUpdated_handlerArgs,
} from "generated";
import { getLatestAdmin } from "@/lib/sound_admins/getLatestAdmin";
import { SOUND_ADMIN_ROLE } from "@/lib/consts";

SoundEditionV2_1.RolesUpdated.handler(
  async ({ event, context }: SoundEditionV2_1_RolesUpdated_handlerArgs) => {
    const roles = Number(event.params.roles);
    const hasAdminRole = (roles & SOUND_ADMIN_ROLE) !== 0;

    // Skip if only MINTER_ROLE is set without ADMIN_ROLE (exclude minter contract noise)
    if (!hasAdminRole && roles !== 0) return;

    const tokenId = BigInt(0); // Sound.xyz only has edition-level permissions
    const entity: Sound_Admins = {
      id: `${event.srcAddress.toLowerCase()}_${event.chainId}_${tokenId.toString()}_${event.params.user.toLowerCase()}`,
      collection: event.srcAddress.toLowerCase(),
      token_id: tokenId,
      admin: event.params.user.toLowerCase(),
      roles,
      chain_id: event.chainId,
      updated_at: event.block.timestamp,
    };

    const latestAdmin = await getLatestAdmin(entity, context);
    context.Sound_Admins.set(latestAdmin);
  }
);
