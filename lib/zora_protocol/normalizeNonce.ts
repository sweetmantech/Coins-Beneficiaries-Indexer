/** CommentIdentifier.nonce — valid even when zero; do not treat 0x00..00 as absent */
export function normalizeNonce(value: string | null | undefined): string | undefined {
  if (value == null || value === "") return undefined;
  return value.toLowerCase();
}
