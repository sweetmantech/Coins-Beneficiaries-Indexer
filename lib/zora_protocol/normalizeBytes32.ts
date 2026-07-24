const ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000";

export function normalizeBytes32(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized === ZERO_BYTES32) return undefined;
  return normalized;
}
