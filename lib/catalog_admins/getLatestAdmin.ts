import { handlerContext, Catalog_Admins } from "generated";

export async function getLatestAdmin(entity: Catalog_Admins, context: handlerContext) {
  const existingEntity = await context.Catalog_Admins.get(entity.id);

  if (!existingEntity) return entity;
  if (entity.updated_at >= existingEntity.updated_at)
    return {
      ...existingEntity,
      auth_scope: entity.auth_scope,
      updated_at: entity.updated_at,
    };

  return existingEntity;
}
