import {
  type ZoraComments_Commented_handlerArgs,
  type InProcessComments_Commented_handlerArgs,
} from "generated";
import { buildComment } from "@/lib/zora_protocol/buildComment";

export async function handleCommented({
  event,
  context,
}: ZoraComments_Commented_handlerArgs | InProcessComments_Commented_handlerArgs) {
  const [commenter, contractAddress, tokenId, nonce] = event.params.commentIdentifier;
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
      nonce,
      sparksQuantity: event.params.sparksQuantity,
    })
  );
}
