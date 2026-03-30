import {
  handlerContext,
  InProcess_Collections,
  InProcessMoment_ContractMetadataUpdated_event,
} from "generated";

async function getValidateExistingEntity(
  event: InProcessMoment_ContractMetadataUpdated_event,
  context: handlerContext
): Promise<InProcess_Collections | undefined> {
  const collection = event.srcAddress.toLowerCase();
  const entityId = `${collection}_${event.chainId}`;

  const existingEntity = await context.InProcess_Collections.get(entityId);

  if (!existingEntity) {
    return undefined;
  }

  if (existingEntity.updated_at >= event.block.timestamp) {
    return undefined;
  }

  return existingEntity;
}

export default getValidateExistingEntity;
