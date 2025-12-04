import { CoopCreator1155, CoopCreator1155_Purchased } from "generated";

CoopCreator1155.Purchased.handler(
  async ({ event, context }) => {
    const purchasedEntity: CoopCreator1155_Purchased = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      sender: event.params.sender,
      minter: event.params.minter,
      tokenId: event.params.tokenId,
      quantity: event.params.quantity,
      value: event.params.value,
      transactionHash: event.transaction.hash,
      blockNumber: event.block.number,
    };
    context.CoopCreator1155_Purchased.set(purchasedEntity);
  },
  { wildcard: true }
);
