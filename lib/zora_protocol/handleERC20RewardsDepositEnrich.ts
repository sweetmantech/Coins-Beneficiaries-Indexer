import { type Transfers } from "envio";
import { getPreviousTransfers } from "@/lib/in_process_transfers/getPreviousTransfers";

interface ERC20RewardsDepositEvent {
  params: { collection: string; tokenId: bigint };
  chainId: number;
  transaction: { hash: string };
  logIndex: bigint | number;
}

interface Context {
  Transfers: {
    set: (entity: Transfers) => void;
    getWhere: { transaction_hash: { eq: (hash: string) => Promise<Transfers[]> } };
  };
  Primary_Sales: {
    get: (id: string) => Promise<{ price_per_token: bigint; currency: string } | undefined | null>;
  };
}

export async function handleERC20RewardsDepositEnrich(
  event: ERC20RewardsDepositEvent,
  context: Context
) {
  const collection = event.params.collection.toLowerCase();
  const tokenIdStr = event.params.tokenId.toString();
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
  const sale = await context.Primary_Sales.get(`${collection}_${tokenIdStr}_${event.chainId}`);
  if (!sale) return;
  context.Transfers.set({
    ...t,
    value: sale.price_per_token * t.quantity,
    currency: sale.currency,
  });
}
