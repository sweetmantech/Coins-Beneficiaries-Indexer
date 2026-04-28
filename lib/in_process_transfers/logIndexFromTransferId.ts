/** Parses the trailing `_<logIndex>` segment from ids produced by `transferId`. */
export function logIndexFromTransferId(id: string): number | undefined {
  const last = id.split("_").pop();
  if (last === undefined) return undefined;
  const n = Number(last);
  return Number.isFinite(n) ? n : undefined;
}
