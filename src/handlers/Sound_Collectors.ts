import {
  SuperMinterV2Collectors,
  type SuperMinterV2Collectors_Minted_handlerArgs,
  type Collectors,
  type Payments,
} from "generated";
import formatUnits from "@/lib/formatUnits";
import { zeroAddress } from "viem";

SuperMinterV2Collectors.Minted.handler(
  async ({ event, context }: SuperMinterV2Collectors_Minted_handlerArgs) => {
    const edition = event.params.edition.toLowerCase();
    const tier = BigInt(event.params.tier);
    // MintedLogData tuple indices:
    // [0]=quantity, [1]=fromTokenId, [2]=allowlisted, [3]=allowlistedQuantity,
    // [4]=signedQuantity, [5]=signedClaimTicket, [6]=affiliate, [7]=affiliated,
    // [8]=requiredEtherValue, [9]=unitPrice, [10]=finalArtistFee,
    // [11]=finalAffiliateFee, [12]=finalPlatformFee
    const quantity = event.params.data[0];
    const finalArtistFee = event.params.data[10];

    const collectEntity: Collectors = {
      id: `${edition}_${tier}_${event.chainId}_${event.block.number}_${event.logIndex}`,
      collection: edition,
      token_id: tier + 1n,
      amount: quantity,
      chain_id: event.chainId,
      collector: event.params.to.toLowerCase(),
      transaction_hash: event.transaction.hash,
      collected_at: event.block.timestamp,
    };
    context.Collectors.set(collectEntity);

    if (finalArtistFee === 0n) return;

    const editionEntity = await context.Sound_Editions.get(`${edition}_${event.chainId}`);
    const recipient = editionEntity?.funding_recipient ?? edition;

    const paymentEntity: Payments = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      collection: edition,
      currency: zeroAddress,
      token_id: tier + 1n,
      spender: event.params.to.toLowerCase(),
      recipient,
      amount: formatUnits(finalArtistFee, 18),
      chain_id: event.chainId,
      transaction_hash: event.transaction.hash,
      transferred_at: event.block.timestamp,
    };
    context.Payments.set(paymentEntity);
  }
);
