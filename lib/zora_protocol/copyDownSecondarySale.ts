import { type Secondary_Sales } from "generated";

interface Context {
  Secondary_Sales: {
    get: (id: string) => Promise<Secondary_Sales | undefined | null>;
    set: (entity: Secondary_Sales) => void;
  };
}

export async function copyDownSecondarySale(
  entityId: string,
  tokenId: bigint,
  collection: string,
  chainId: number,
  context: Context
) {
  const contractBase = await context.Secondary_Sales.get(`${collection}_0_${chainId}`);
  if (!contractBase) return;
  const existing = await context.Secondary_Sales.get(entityId);
  if (existing) return;
  context.Secondary_Sales.set({ ...contractBase, id: entityId, token_id: tokenId });
}
