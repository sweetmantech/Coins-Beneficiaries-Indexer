import { type Transfers } from "envio";
import transferId from "@/lib/in_process_transfers/transferId";

interface TransferSingleEvent {
  srcAddress: string;
  params: { id: bigint; to: string; value: bigint };
  chainId: number;
  transaction: { hash: string };
  block: { number: number; timestamp: number };
  logIndex: bigint | number;
}

interface Context {
  Transfers: { set: (entity: Transfers) => void };
}

export function handleTransferSingleMint(event: TransferSingleEvent, context: Context) {
  const collection = event.srcAddress.toLowerCase();
  context.Transfers.set({
    id: transferId(
      collection,
      event.params.id.toString(),
      event.chainId,
      event.transaction.hash,
      Number(event.logIndex)
    ),
    collection,
    token_id: event.params.id,
    chain_id: event.chainId,
    recipient: event.params.to.toLowerCase(),
    quantity: event.params.value,
    value: undefined,
    currency: undefined,
    transaction_hash: event.transaction.hash,
    block_number: BigInt(event.block.number),
    transferred_at: event.block.timestamp,
  });
}
