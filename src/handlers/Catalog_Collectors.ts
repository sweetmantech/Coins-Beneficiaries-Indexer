import {
  CatalogRelease1155,
  type CatalogRelease1155_TokenPurchased_handlerArgs,
  type Collectors,
  type Payments,
} from "generated";
import getUsdcTransfer from "@/lib/catalog_payments/getUsdcTransfer";
import { USDC_ADDRESSES } from "@/lib/consts";
import { zeroAddress } from "viem";

CatalogRelease1155.TokenPurchased.handler(
  async ({ event, context }: CatalogRelease1155_TokenPurchased_handlerArgs) => {
    const collectEntity: Collectors = {
      id: `${event.srcAddress.toLowerCase()}_${event.params.tokenId.toString()}_${event.chainId}_${event.block.number}_${event.logIndex}`,
      collection: event.srcAddress.toLowerCase(),
      token_id: event.params.tokenId,
      amount: event.params.amount,
      chain_id: event.chainId,
      collector: event.params.buyer.toLowerCase(),
      transaction_hash: event.transaction.hash,
      collected_at: event.block.timestamp,
    };

    context.Collectors.set(collectEntity);

    const { recipient, amount } = await getUsdcTransfer(event);

    if (amount === "0.000000" || recipient === zeroAddress) return;

    const paymentEntity: Payments = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      collection: event.srcAddress.toLowerCase(),
      currency: USDC_ADDRESSES[event.chainId] ?? zeroAddress,
      token_id: event.params.tokenId,
      spender: event.params.buyer.toLowerCase(),
      recipient: recipient.toLowerCase(),
      amount,
      chain_id: event.chainId,
      transaction_hash: event.transaction.hash,
      transferred_at: event.block.timestamp,
    };

    context.Payments.set(paymentEntity);
  }
);
