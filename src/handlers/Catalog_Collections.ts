import {
  CatalogReleaseFactory,
  CatalogRelease1155,
  type Catalog_Collections,
  type CatalogReleaseFactory_CRContractCreated_handlerArgs,
  type CatalogRelease1155_URI_handlerArgs,
  type contractRegistrations,
} from "generated";
import getNameFromCalldata from "@/lib/catalog_collections/getNameFromCalldata";

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
  }
);

CatalogRelease1155.URI.handler(async ({ event, context }: CatalogRelease1155_URI_handlerArgs) => {
  if (event.params.id === BigInt(0)) {
    const existingEntity = await context.Catalog_Collections.get(
      `${event.srcAddress.toLowerCase()}_${event.chainId}`
    );
    context.Catalog_Collections.set({
      ...existingEntity!,
      uri: event.params.value,
      updated_at: event.block.timestamp,
    });
    return;
  }
  const existingEntity = await context.Catalog_Moments.get(
    `${event.srcAddress.toLowerCase()}_${event.params.id}_${event.chainId}`
  );

  context.Catalog_Moments.set({
    ...existingEntity!,
    uri: event.params.value,
    updated_at: event.block.timestamp,
  });
});
