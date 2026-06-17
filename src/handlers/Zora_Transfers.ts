import {
  ZoraCreator1155,
  ZoraERC20Minter,
  type ZoraCreator1155_TransferSingle_handlerArgs,
  type ZoraCreator1155_Purchased_handlerArgs,
  type ZoraERC20Minter_ERC20RewardsDeposit_handlerArgs,
} from "generated";
import { zeroAddress } from "viem";
import transferId from "@/lib/in_process_transfers/transferId";
import { getPreviousTransfers } from "@/lib/in_process_transfers/getPreviousTransfers";

// Step 1 — ERC1155 mint: captures recipient + quantity, detects airdrop via operator
ZoraCreator1155.TransferSingle.handler(
  async ({ event, context }: ZoraCreator1155_TransferSingle_handlerArgs) => {
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
  },
  { eventFilters: [{ from: zeroAddress }] }
);

// ETH paid mint: Purchased lacks mint logIndex — same-tx rows via indexed `transaction_hash`, then pick preceding mint.
ZoraCreator1155.Purchased.handler(
  async ({ event, context }: ZoraCreator1155_Purchased_handlerArgs) => {
    const collection = event.srcAddress.toLowerCase();
    const transfers = await context.Transfers.getWhere.transaction_hash.eq(event.transaction.hash);
    const scoped = transfers.filter(
      (transfer) =>
        transfer.collection === collection &&
        transfer.token_id === event.params.tokenId &&
        transfer.chain_id === event.chainId
    );
    const previous = getPreviousTransfers(scoped, Number(event.logIndex));
    const t = previous[0];
    if (!t) return;

    context.Transfers.set({
      ...t,
      value: event.params.value,
      currency: zeroAddress,
    });
  }
);

/** ERC20 path: Deposit event has no mint log — same-tx `transaction_hash` query, then mint row before this deposit log. */
ZoraERC20Minter.ERC20RewardsDeposit.handler(
  async ({ event, context }: ZoraERC20Minter_ERC20RewardsDeposit_handlerArgs) => {
    const collection = event.params.collection.toLowerCase();
    const tokenIdStr = event.params.tokenId.toString();

    const transfers = await context.Transfers.getWhere.transaction_hash.eq(event.transaction.hash);
    const scoped = transfers.filter(
      (transfer) =>
        transfer.collection === collection &&
        transfer.token_id === event.params.tokenId &&
        transfer.chain_id === event.chainId
    );
    const previous = getPreviousTransfers(scoped, Number(event.logIndex));
    const t = previous[0];
    if (!t) return;

    const saleId = `${collection}_${tokenIdStr}_${event.chainId}`;
    const sale = await context.Primary_Sales.get(saleId);
    if (!sale) return;

    context.Transfers.set({
      ...t,
      value: sale.price_per_token * t.quantity,
      currency: sale.currency,
    });
  }
);
