/** IN PUBLIC ERC-1155 on Base (Yuri / @inpublic). */
export const IN_PUBLIC_1155 = "0x3f209430017e4Fa79FEcf663Faff8584c0feAc78";

/** Zora canonical fixed-price sale strategy (legacy mint comments for IN PUBLIC). */
export const ZORA_FIXED_PRICE_SALE_STRATEGY =
  "0x04E2516A2c207E84a1839755675dfd8eF6302F0a";

/** IN PUBLIC 1155 deploy block on Base — shared start_block for InPublic1155 + mint comments. */
export const IN_PUBLIC_DEPLOY_BLOCK = 17016014;

export function isInPublicCollection(address: string): boolean {
  return address.toLowerCase() === IN_PUBLIC_1155.toLowerCase();
}
