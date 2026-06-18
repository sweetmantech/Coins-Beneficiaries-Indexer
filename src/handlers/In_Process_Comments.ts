import {
  InProcessERC20Minter,
  InProcessCreatorFixedPriceSaleStrategy,
  type InProcessERC20Minter_MintComment_handlerArgs,
  type InProcessCreatorFixedPriceSaleStrategy_MintComment_handlerArgs,
} from "generated";
import buildComment from "@/lib/in_process_comments/buildComment";

InProcessERC20Minter.MintComment.handler(
  async ({ event, context }: InProcessERC20Minter_MintComment_handlerArgs) => {
    context.InProcess_Comments.set(
      buildComment(
        event.params.tokenContract,
        event.params.tokenId,
        event.params.sender,
        event.params.comment,
        event.chainId,
        event.block.number,
        event.logIndex,
        event.block.timestamp,
        event.transaction.hash
      )
    );
  }
);

InProcessCreatorFixedPriceSaleStrategy.MintComment.handler(
  async ({ event, context }: InProcessCreatorFixedPriceSaleStrategy_MintComment_handlerArgs) => {
    context.InProcess_Comments.set(
      buildComment(
        event.params.tokenContract,
        event.params.tokenId,
        event.params.sender,
        event.params.comment,
        event.chainId,
        event.block.number,
        event.logIndex,
        event.block.timestamp,
        event.transaction.hash
      )
    );
  }
);
