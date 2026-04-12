import {
  CatalogRelease1155,
  type Catalog_Admins,
  type CatalogRelease1155_ContractPermissionsUpdated_handlerArgs,
  type CatalogRelease1155_TokenPermissionsUpdated_handlerArgs,
} from "generated";
import { getLatestAdmin } from "@/lib/catalog_admins/getLatestAdmin";
import { hasFullAdminScope } from "@/lib/catalog_admins/hasFullAdminScope";

// contract-level: tokenId = 0
CatalogRelease1155.ContractPermissionsUpdated.handler(
  async ({ event, context }: CatalogRelease1155_ContractPermissionsUpdated_handlerArgs) => {
    const authScope = Number(event.params.authScope);
    if (!hasFullAdminScope(authScope)) return;

    const tokenId = BigInt(0);
    const entity: Catalog_Admins = {
      id: `${event.srcAddress.toLowerCase()}_${event.chainId}_${tokenId.toString()}_${event.params.user.toLowerCase()}`,
      collection: event.srcAddress.toLowerCase(),
      token_id: tokenId,
      admin: event.params.user.toLowerCase(),
      chain_id: event.chainId,
      auth_scope: authScope,
      updated_at: event.block.timestamp,
    };

    const latestAdmin = await getLatestAdmin(entity, context);
    context.Catalog_Admins.set(latestAdmin);
  }
);

// token-level
CatalogRelease1155.TokenPermissionsUpdated.handler(
  async ({ event, context }: CatalogRelease1155_TokenPermissionsUpdated_handlerArgs) => {
    const authScope = Number(event.params.authScope);
    if (!hasFullAdminScope(authScope)) return;

    const entity: Catalog_Admins = {
      id: `${event.srcAddress.toLowerCase()}_${event.chainId}_${event.params.tokenId.toString()}_${event.params.user.toLowerCase()}`,
      collection: event.srcAddress.toLowerCase(),
      token_id: event.params.tokenId,
      admin: event.params.user.toLowerCase(),
      chain_id: event.chainId,
      auth_scope: authScope,
      updated_at: event.block.timestamp,
    };

    const latestAdmin = await getLatestAdmin(entity, context);
    context.Catalog_Admins.set(latestAdmin);
  }
);
