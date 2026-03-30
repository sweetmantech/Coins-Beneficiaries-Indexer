import { handlerContext, Catalog_Moments, CatalogRelease1155_URI_event } from "generated";

async function getExistingEntity(
  event: CatalogRelease1155_URI_event,
  context: handlerContext
): Promise<Catalog_Moments | undefined> {
  const collection = event.srcAddress.toLowerCase();
  const entityId = `${collection}_${event.params.id}_${event.chainId}`;

  const existingEntity = await context.Catalog_Moments.get(entityId);

  if (!existingEntity) {
    return undefined;
  }

  if (existingEntity.updated_at >= event.block.timestamp) {
    return undefined;
  }

  return existingEntity;
}

export default getExistingEntity;
