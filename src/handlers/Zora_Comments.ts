import {
  ZoraERC20Minter,
  ZoraCreatorFixedPriceSaleStrategy,
  type ZoraERC20Minter_MintComment_handlerArgs,
  type ZoraCreatorFixedPriceSaleStrategy_MintComment_handlerArgs,
} from "generated";
import { buildComment } from "@/lib/zora_protocol/buildComment";

ZoraERC20Minter.MintComment.handler(
  async ({ event, context }: ZoraERC20Minter_MintComment_handlerArgs) => {
    context.Zora_Comments.set(
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

ZoraCreatorFixedPriceSaleStrategy.MintComment.handler(
  async ({ event, context }: ZoraCreatorFixedPriceSaleStrategy_MintComment_handlerArgs) => {
    context.Zora_Comments.set(
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
