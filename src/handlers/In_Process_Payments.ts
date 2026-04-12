import {
  InProcessERC20Minter,
  InProcessMoment,
  type Payments,
  type InProcessERC20Minter_ERC20RewardsDeposit_handlerArgs,
  type InProcessMoment_Purchased_handlerArgs,
} from "generated";
import getUsdcTransfer from "@/lib/in_process_payments/getUsdcTransfer";
import { formatEther, zeroAddress } from "viem";
import extractPurchaseRecipientAndComment from "@/lib/extractPurchaseRecipientAndComment";

InProcessERC20Minter.ERC20RewardsDeposit.handler(
  async ({ event, context }: InProcessERC20Minter_ERC20RewardsDeposit_handlerArgs) => {
    const usdcTransfer = await getUsdcTransfer(event);
    const entity: Payments = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      collection: event.params.collection,
      currency: event.params.currency,
      token_id: event.params.tokenId,
      chain_id: event.chainId,
      recipient: usdcTransfer.recipient,
      spender: usdcTransfer.spender,
      amount: usdcTransfer.amount,
      transaction_hash: event.transaction.hash,
      transferred_at: event.block.timestamp,
    };

    context.Payments.set(entity);
  }
);

InProcessMoment.Purchased.handler(
  async ({ event, context }: InProcessMoment_Purchased_handlerArgs) => {
    const { recipient, mintComment } = await extractPurchaseRecipientAndComment(event);

    if (mintComment) {
      context.InProcess_Moment_Comments.set(mintComment);
    }

    const entity: Payments = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      collection: event.srcAddress.toLowerCase(),
      currency: zeroAddress,
      token_id: event.params.tokenId,
      amount: formatEther(event.params.value),
      spender: event.params.sender.toLowerCase(),
      recipient: recipient.toLowerCase(),
      chain_id: event.chainId,
      transaction_hash: event.transaction.hash,
      transferred_at: event.block.timestamp,
    };

    if (event.params.value === BigInt(0) || recipient === zeroAddress) return;
    context.Payments.set(entity);
  }
);
