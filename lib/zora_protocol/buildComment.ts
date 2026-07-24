const ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000";

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
  sparksQuantity?: bigint | null;
};

function normalizeBytes32(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized === ZERO_BYTES32) return undefined;
  return normalized;
}

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
    sparks_quantity: sparksQuantity ?? undefined,
    commented_at: timestamp,
    transaction_hash: txHash,
    chain_id: chainId,
  };
}
