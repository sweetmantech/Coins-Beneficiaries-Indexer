import {
  handlerContext,
  InProcess_Airdrops,
  InProcessMoment_TransferSingle_event,
} from "generated";

async function getEntity(
  event: InProcessMoment_TransferSingle_event,
  context: handlerContext
): Promise<InProcess_Airdrops> {
  const collection = event.srcAddress.toLowerCase();
  const entityId = `${collection}_${event.params.id.toString()}_${event.chainId}_${event.params.to}`;

  const existingEntity = await context.InProcess_Airdrops.get(entityId);

  if (!existingEntity) {
    return {
      id: entityId,
      recipient: event.params.to,
      collection,
      token_id: event.params.id,
      amount: event.params.value,
      chain_id: event.chainId,
      updated_at: event.block.timestamp,
    };
  }

  return {
    ...existingEntity,
    amount: existingEntity.amount + event.params.value,
    updated_at: event.block.timestamp,
  };
}

export default getEntity;
