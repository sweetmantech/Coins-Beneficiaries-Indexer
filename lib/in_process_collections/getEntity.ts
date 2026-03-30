import {
  handlerContext,
  InProcess_Collections,
  InProcessMoment_TransferSingle_event,
} from "generated";

async function getEntity(
  event: InProcessMoment_TransferSingle_event,
  context: handlerContext
): Promise<InProcess_Collections | undefined> {
  const collection = event.srcAddress.toLowerCase();
  const entityId = `${collection}_${event.chainId}`;

  const existingEntity = await context.InProcess_Collections.get(entityId);

  if (!existingEntity) {
    return undefined;
  }

  return existingEntity;
}

export default getEntity;
