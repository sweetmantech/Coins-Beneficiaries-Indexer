import { handlerContext, Catalog_Collections, CatalogRelease1155_URI_event } from "generated";

async function getValidateExistingEntity(
  event: CatalogRelease1155_URI_event,
  context: handlerContext
): Promise<Catalog_Collections | undefined> {
  const collection = event.srcAddress.toLowerCase();
  const entityId = `${collection}_${event.chainId}`;

  const existingEntity = await context.Catalog_Collections.get(entityId);

  if (!existingEntity) {
    return undefined;
  }

  if (existingEntity.updated_at >= event.block.timestamp) {
    return undefined;
  }

  return existingEntity;
}

export default getValidateExistingEntity;
