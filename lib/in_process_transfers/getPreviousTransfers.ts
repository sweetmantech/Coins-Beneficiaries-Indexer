import { logIndexFromTransferId } from "@/lib/in_process_transfers/logIndexFromTransferId";

/** Same-tx rows: id에서 뽑은 logIndex가 현재 이벤트보다 작은 transfer만 모아, logIndex 내림차순. */
export function getPreviousTransfers<T extends { id: string }>(
  transfers: T[],
  currentLogIndex: number
): T[] {
  const matched: T[] = [];
  for (const transfer of transfers) {
    const extractedLogIndex = logIndexFromTransferId(transfer.id);
    if (extractedLogIndex !== undefined && extractedLogIndex < currentLogIndex) {
      matched.push(transfer);
    }
  }
  matched.sort(
    (a, b) => (logIndexFromTransferId(b.id) ?? -1) - (logIndexFromTransferId(a.id) ?? -1)
  );
  return matched;
}
