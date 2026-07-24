import { normalizeBytes32 } from "@/lib/zora_protocol/normalizeBytes32";
import { normalizeNonce } from "@/lib/zora_protocol/normalizeNonce";

export type BuildCommentInput = {
  tokenContract: string;
  tokenId: bigint;
  sender: string;
  comment: string;
  chainId: number;
  blockNumber: number;
  logIndex: bigint | number;
  timestamp: number;
  txHash: string;
  commentId?: string | null;
  replyToId?: string | null;
  nonce?: string | null;
  sparksQuantity?: bigint | null;
};

export function buildComment({
  tokenContract,
  tokenId,
  sender,
  comment,
  chainId,
  blockNumber,
  logIndex,
  timestamp,
  txHash,
  commentId,
  replyToId,
  nonce,
  sparksQuantity,
}: BuildCommentInput) {
  const collection = tokenContract.toLowerCase();
  const normalizedCommentId = normalizeBytes32(commentId);

  return {
    id: normalizedCommentId
      ? `${normalizedCommentId}_${chainId}`
      : `${collection}_${tokenId}_${chainId}_${blockNumber}_${logIndex}`,
    sender: sender.toLowerCase(),
    collection,
    token_id: tokenId,
    comment,
    comment_id: normalizedCommentId,
    reply_to_id: normalizeBytes32(replyToId),
    nonce: normalizeNonce(nonce),
    sparks_quantity: sparksQuantity ?? undefined,
    commented_at: timestamp,
    transaction_hash: txHash,
    chain_id: chainId,
  };
}
