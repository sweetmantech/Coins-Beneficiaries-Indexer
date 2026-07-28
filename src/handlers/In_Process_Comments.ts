import {
  InProcessERC20Minter,
  InProcessCreatorFixedPriceSaleStrategy,
  ZoraComments,
  InProcessComments,
  type InProcessERC20Minter_MintComment_handlerArgs,
  type InProcessCreatorFixedPriceSaleStrategy_MintComment_handlerArgs,
} from "generated";
import { buildComment } from "@/lib/zora_protocol/buildComment";
import { handleCommented } from "@/lib/zora_protocol/handleCommented";

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

ZoraComments.Commented.handler(handleCommented);
InProcessComments.Commented.handler(handleCommented);
