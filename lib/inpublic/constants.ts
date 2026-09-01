/** IN PUBLIC ERC-1155 on Base (Yuri / @inpublic). */
export const IN_PUBLIC_1155 = "0x3f209430017e4Fa79FEcf663Faff8584c0feAc78";

/** Legacy Zora fixed-price sale — IN PUBLIC mint comments for tokens 1–11. */
export const ZORA_FIXED_PRICE_SALE_LEGACY =
  "0x04E2516A2c207E84a1839755675dfd8eF6302F0a";

/** Current Zora fixed-price sale on Base — IN PUBLIC mint comments from token 12+. */
export const ZORA_FIXED_PRICE_SALE =
  "0x777777722d078c97c6ad07d9f36801e653e356ae";

/** IN PUBLIC 1155 deploy block on Base — shared start_block for InPublic1155 + mint comments. */
export const IN_PUBLIC_DEPLOY_BLOCK = 17016014;

export function isInPublicCollection(address: string): boolean {
  return address.toLowerCase() === IN_PUBLIC_1155.toLowerCase();
}
