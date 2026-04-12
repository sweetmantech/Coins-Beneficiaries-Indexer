import {
  SoundEditionV2_1,
  type SoundEditionV2_1_Minted_handlerArgs,
  type SoundEditionV2_1_Airdropped_handlerArgs,
  type Transfers,
} from "generated";

// Covers all mints: user purchases (via SuperMinterV2) and direct admin mints
SoundEditionV2_1.Minted.handler(async ({ event, context }: SoundEditionV2_1_Minted_handlerArgs) => {
  const collection = event.srcAddress.toLowerCase();
  const tier = BigInt(event.params.tier);

  const entity: Transfers = {
    id: `${collection}_${tier}_${event.chainId}_${event.block.number}_${event.logIndex}`,
    collection,
    token_id: tier + 1n,
    chain_id: event.chainId,
    recipient: event.params.to.toLowerCase(),
    quantity: BigInt(event.params.quantity),
    payer: undefined,
    value: undefined,
    currency: undefined,
    funds_recipient: undefined,
    transaction_hash: event.transaction.hash,
    block_number: BigInt(event.block.number),
    transferred_at: event.block.timestamp,
  };
  context.Transfers.set(entity);
});

// Covers all airdrops: platform-initiated (via SuperMinterV2) and direct admin calls
SoundEditionV2_1.Airdropped.handler(
  async ({ event, context }: SoundEditionV2_1_Airdropped_handlerArgs) => {
    const collection = event.srcAddress.toLowerCase();
    const tier = BigInt(event.params.tier);

    for (const [i, recipient] of event.params.to.entries()) {
      context.Transfers.set({
        id: `${collection}_${tier}_${event.chainId}_${event.block.number}_${event.logIndex}_${i}`,
        collection,
        token_id: tier + 1n,
        chain_id: event.chainId,
        recipient: recipient.toLowerCase(),
        quantity: BigInt(event.params.quantity),
        payer: undefined,
        value: undefined,
        currency: undefined,
        funds_recipient: undefined,
        transaction_hash: event.transaction.hash,
        block_number: BigInt(event.block.number),
        transferred_at: event.block.timestamp,
      });
    }
  }
);
