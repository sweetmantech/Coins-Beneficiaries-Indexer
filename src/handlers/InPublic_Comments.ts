import {
  ZoraFixedPriceSaleStrategy,
  type ZoraFixedPriceSaleStrategy_MintComment_handlerArgs,
} from "generated";
import { buildComment } from "@/lib/zora_protocol/buildComment";
import { IN_PUBLIC_1155, isInPublicCollection } from "@/lib/inpublic/constants";

// MintComment emits from Zora fixed-price sale (0x04E2516…), not InPublic1155.
// eventFilters + handler scope: only Yuri IN PUBLIC collection tokens (1–43).
ZoraFixedPriceSaleStrategy.MintComment.handler(
  async ({ event, context }: ZoraFixedPriceSaleStrategy_MintComment_handlerArgs) => {
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
  },
  { eventFilters: [{ tokenContract: IN_PUBLIC_1155 }] }
);
