import { handlerContext, Sound_Admins } from "generated";

export async function getLatestAdmin(entity: Sound_Admins, context: handlerContext) {
  const existingEntity = await context.Sound_Admins.get(entity.id);

  if (!existingEntity) return entity;
  if (entity.updated_at >= existingEntity.updated_at)
    return {
      ...existingEntity,
      roles: entity.roles,
      updated_at: entity.updated_at,
    };

  return existingEntity;
}
