import { zeroAddress } from "viem";
import { type Transfers } from "generated";
import { getPreviousTransfers } from "@/lib/in_process_transfers/getPreviousTransfers";

interface PurchasedEvent {
  srcAddress: string;
  params: { tokenId: bigint; value: bigint };
  chainId: number;
  transaction: { hash: string };
  logIndex: bigint | number;
}

interface Context {
  Transfers: {
    set: (entity: Transfers) => void;
    getWhere: { transaction_hash: { eq: (hash: string) => Promise<Transfers[]> } };
  };
}

export async function handlePurchasedEnrich(event: PurchasedEvent, context: Context) {
  const collection = event.srcAddress.toLowerCase();
  const transfers = await context.Transfers.getWhere.transaction_hash.eq(event.transaction.hash);
  const scoped = transfers.filter(
    (t) =>
      t.collection === collection &&
      t.token_id === event.params.tokenId &&
      t.chain_id === event.chainId
  );
  const previous = getPreviousTransfers(scoped, Number(event.logIndex));
  const t = previous[0];
  if (!t) return;
  context.Transfers.set({ ...t, value: event.params.value, currency: zeroAddress });
}
