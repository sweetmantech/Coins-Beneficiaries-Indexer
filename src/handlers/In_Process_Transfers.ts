import {
  InProcessMoment,
  InProcessERC20Minter,
  type InProcessMoment_TransferSingle_handlerArgs,
  type InProcessMoment_Purchased_handlerArgs,
  type InProcessERC20Minter_ERC20RewardsDeposit_handlerArgs,
} from "generated";
import { zeroAddress } from "viem";
import transferId from "@/lib/in_process_transfers/transferId";

// Step 1 — ERC1155 mint: captures recipient + quantity, detects airdrop via operator
InProcessMoment.TransferSingle.handler(
  async ({ event, context }: InProcessMoment_TransferSingle_handlerArgs) => {
    const collection = event.srcAddress.toLowerCase();

    context.Transfers.set({
      id: transferId(collection, event.params.id.toString(), event.chainId, event.transaction.hash),
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

// Step 2a — ETH mint: updates Transfer with value + currency
InProcessMoment.Purchased.handler(
  async ({ event, context }: InProcessMoment_Purchased_handlerArgs) => {
    const collection = event.srcAddress.toLowerCase();
    const id = transferId(
      collection,
      event.params.tokenId.toString(),
      event.chainId,
      event.transaction.hash
    );
    const transfer = await context.Transfers.get(id);
    if (!transfer) return;

    context.Transfers.set({
      ...transfer,
      value: event.params.value,
      currency: zeroAddress,
    });
  }
);

// Step 2b — ERC20 mint: updates Transfer with value + currency from Primary_Sales
InProcessERC20Minter.ERC20RewardsDeposit.handler(
  async ({ event, context }: InProcessERC20Minter_ERC20RewardsDeposit_handlerArgs) => {
    const collection = event.params.collection.toLowerCase();
    const id = transferId(
      collection,
      event.params.tokenId.toString(),
      event.chainId,
      event.transaction.hash
    );
    const transfer = await context.Transfers.get(id);
    if (!transfer) return;

    const saleId = `${collection}_${event.params.tokenId.toString()}_${event.chainId}`;
    const sale = await context.Primary_Sales.get(saleId);
    if (!sale) return;

    context.Transfers.set({
      ...transfer,
      value: sale.price_per_token * transfer.quantity,
      currency: sale.currency,
    });
  }
);
