import {
  ZoraCreatorFixedPriceSaleStrategy,
  type ZoraCreatorFixedPriceSaleStrategy_MintComment_handlerArgs,
} from "generated";
import { buildComment } from "@/lib/zora_protocol/buildComment";
import { isInPublicCollection } from "@/lib/inpublic/constants";

ZoraCreatorFixedPriceSaleStrategy.MintComment.handler(
  async ({ event, context }: ZoraCreatorFixedPriceSaleStrategy_MintComment_handlerArgs) => {
    if (!isInPublicCollection(event.params.tokenContract)) return;

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
