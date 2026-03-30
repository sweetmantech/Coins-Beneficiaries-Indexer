import {
  InProcessERC20Minter,
  type InProcess_Moment_Comments,
  type InProcessERC20Minter_MintComment_handlerArgs,
} from "generated";

InProcessERC20Minter.MintComment.handler(
  async ({ event, context }: InProcessERC20Minter_MintComment_handlerArgs) => {
    const entity: InProcess_Moment_Comments = {
      id: `${event.params.tokenContract.toLowerCase()}_${event.params.tokenId}_${event.chainId}_${event.block.number}_${event.logIndex}`,
      sender: event.params.sender.toLowerCase(),
      collection: event.params.tokenContract.toLowerCase(),
      token_id: event.params.tokenId,
      comment: event.params.comment,
      commented_at: event.block.timestamp,
      transaction_hash: event.transaction.hash,
      chain_id: event.chainId,
    };

    context.InProcess_Moment_Comments.set(entity);
  }
);
