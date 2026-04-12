import {
  CatalogReleaseFactory,
  CatalogRelease1155,
  type Catalog_Collections,
  type Catalog_Admins,
  type CatalogReleaseFactory_CRContractCreated_handlerArgs,
  type CatalogRelease1155_URI_handlerArgs,
  type contractRegistrations,
} from "generated";
import getValidateExistingCollection from "@/lib/catalog_collections/getValidateExistingEntity";
import getExistingMoment from "@/lib/catalog_moments/getExistingEntity";
import getNameFromCalldata from "@/lib/catalog_collections/getNameFromCalldata";
import { getLatestAdmin } from "@/lib/catalog_admins/getLatestAdmin";
import { AUTH_SCOPE_OWNER, AUTH_SCOPE_ARTIST } from "@/lib/consts";

CatalogReleaseFactory.CRContractCreated.contractRegister(
  ({
    event,
    context,
  }: {
    event: { params: { _contractAddress: string } };
    context: contractRegistrations;
  }) => {
    context.addCatalogRelease1155(event.params._contractAddress);
  }
);

CatalogReleaseFactory.CRContractCreated.handler(
  async ({ event, context }: CatalogReleaseFactory_CRContractCreated_handlerArgs) => {
    const contractAddress = event.params._contractAddress.toLowerCase();
    const name = getNameFromCalldata(event.transaction.input);
    const entity: Catalog_Collections = {
      id: `${contractAddress}_${event.chainId}`,
      address: contractAddress,
      name,
      creator: event.params._creator.toLowerCase(),
      uri: "",
      chain_id: event.chainId,
      created_at: event.block.timestamp,
      updated_at: event.block.timestamp,
      transaction_hash: event.transaction.hash,
    };
    context.Catalog_Collections.set(entity);

    // _init() sets contractPermissions[_artist] = OWNER|ARTIST directly in storage
    // without emitting ContractPermissionsUpdated, so we index it here
    const artistAdmin: Catalog_Admins = {
      id: `${contractAddress}_${event.chainId}_0_${event.params._creator.toLowerCase()}`,
      collection: contractAddress,
      token_id: BigInt(0),
      admin: event.params._creator.toLowerCase(),
      chain_id: event.chainId,
      auth_scope: AUTH_SCOPE_OWNER | AUTH_SCOPE_ARTIST,
      updated_at: event.block.timestamp,
    };
    const latestAdmin = await getLatestAdmin(artistAdmin, context);
    context.Catalog_Admins.set(latestAdmin);
  }
);

CatalogRelease1155.URI.handler(async ({ event, context }: CatalogRelease1155_URI_handlerArgs) => {
  if (event.params.id === BigInt(0)) {
    // id 0 is CONTRACT_BASE_ID — contract-level metadata URI
    const existingEntity = await getValidateExistingCollection(event, context);
    if (!existingEntity) return;

    context.Catalog_Collections.set({
      ...existingEntity,
      uri: event.params.value,
      updated_at: event.block.timestamp,
    });
  } else {
    // token-level URI update
    const existingEntity = await getExistingMoment(event, context);
    if (!existingEntity) return;

    context.Catalog_Moments.set({
      ...existingEntity,
      uri: event.params.value,
      updated_at: event.block.timestamp,
    });
  }
});
