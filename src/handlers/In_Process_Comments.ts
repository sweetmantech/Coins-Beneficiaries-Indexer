import {
  InProcessERC20Minter,
  InProcessCreatorFixedPriceSaleStrategy,
  ZoraComments,
  type InProcessERC20Minter_MintComment_handlerArgs,
  type InProcessCreatorFixedPriceSaleStrategy_MintComment_handlerArgs,
  type ZoraComments_Commented_handlerArgs,
} from "generated";
import { buildComment } from "@/lib/zora_protocol/buildComment";

InProcessERC20Minter.MintComment.handler(
  async ({ event, context }: InProcessERC20Minter_MintComment_handlerArgs) => {
    context.InProcess_Comments.set(
      buildComment({
        tokenContract: event.params.tokenContract,
        tokenId: event.params.tokenId,
        sender: event.params.sender,
        comment: event.params.comment,
        chainId: event.chainId,
        blockNumber: event.block.number,
        logIndex: event.logIndex,
        timestamp: event.block.timestamp,
        txHash: event.transaction.hash,
      })
    );
  }
);

InProcessCreatorFixedPriceSaleStrategy.MintComment.handler(
  async ({ event, context }: InProcessCreatorFixedPriceSaleStrategy_MintComment_handlerArgs) => {
    context.InProcess_Comments.set(
      buildComment({
        tokenContract: event.params.tokenContract,
        tokenId: event.params.tokenId,
        sender: event.params.sender,
        comment: event.params.comment,
        chainId: event.chainId,
        blockNumber: event.block.number,
        logIndex: event.logIndex,
        timestamp: event.block.timestamp,
        txHash: event.transaction.hash,
      })
    );
  }
);

ZoraComments.Commented.handler(async ({ event, context }: ZoraComments_Commented_handlerArgs) => {
  const [commenter, contractAddress, tokenId] = event.params.commentIdentifier;
  const collection = contractAddress.toLowerCase();

  const inProcessCollection = await context.InProcess_Collections.get(
    `${collection}_${event.chainId}`
  );
  if (!inProcessCollection) {
    return;
  }

  context.InProcess_Comments.set(
    buildComment({
      tokenContract: contractAddress,
      tokenId,
      sender: commenter,
      comment: event.params.text,
      chainId: event.chainId,
      blockNumber: event.block.number,
      logIndex: event.logIndex,
      timestamp: Number(event.params.timestamp),
      txHash: event.transaction.hash,
      commentId: event.params.commentId,
      replyToId: event.params.replyToId,
      sparksQuantity: event.params.sparksQuantity,
    })
  );
});
