import { handlerContext, InProcess_Admins } from "generated";

/**
 * Checks for existence of an InProcess_Admins entity for a given collection, admin, and chain_id.
 *
 * @param entity - The InProcess_Admins entity to check
 * @param context - The storage context containing InProcess_Admins
 * @returns True if the entity exists, false otherwise
 */
export async function getLatestAdmin(entity: InProcess_Admins, context: handlerContext) {
  const existingEntity = await context.InProcess_Admins.get(entity.id);

  if (!existingEntity) return entity;
  if (entity.updated_at > existingEntity.updated_at)
    return {
      ...existingEntity,
      permission: entity.permission,
      updated_at: entity.updated_at,
    };

  return existingEntity;
}
