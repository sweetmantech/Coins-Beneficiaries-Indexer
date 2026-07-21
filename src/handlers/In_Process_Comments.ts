import { indexer, InProcessERC20Minter, InProcessCreatorFixedPriceSaleStrategy, type InProcessERC20Minter_MintComment_handlerArgs, type InProcessCreatorFixedPriceSaleStrategy_MintComment_handlerArgs } from "envio";
import { buildComment } from "@/lib/zora_protocol/buildComment";

indexer.onEvent(
  { contract: "InProcessERC20Minter", event: "MintComment" },
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

indexer.onEvent(
  { contract: "InProcessCreatorFixedPriceSaleStrategy", event: "MintComment" },
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
