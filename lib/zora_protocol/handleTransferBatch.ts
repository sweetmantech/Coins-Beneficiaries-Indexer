import { type Transfers } from "generated";
import transferId from "@/lib/in_process_transfers/transferId";
import { zeroAddress } from "viem";

interface TransferBatchEvent {
  srcAddress: string;
  params: { to: string; ids: readonly bigint[]; values: readonly bigint[] };
  chainId: number;
  transaction: { hash: string };
  block: { number: number; timestamp: number };
  logIndex: bigint | number;
}

interface Context {
  Transfers: { set: (entity: Transfers) => void };
}

export function handleTransferBatch(event: TransferBatchEvent, context: Context) {
  if (event.params.to.toLowerCase() === zeroAddress) return;

  const collection = event.srcAddress.toLowerCase();
  const logIndex = Number(event.logIndex);

  event.params.ids.forEach((id, i) => {
    const quantity = event.params.values[i] ?? 0n;
    if (quantity === 0n) return;

    context.Transfers.set({
      id: `${transferId(collection, id.toString(), event.chainId, event.transaction.hash, logIndex)}_${i}`,
      collection,
      token_id: id,
      chain_id: event.chainId,
      recipient: event.params.to.toLowerCase(),
      quantity,
      value: undefined,
      currency: undefined,
      transaction_hash: event.transaction.hash,
      block_number: BigInt(event.block.number),
      transferred_at: event.block.timestamp,
    });
  });
}
