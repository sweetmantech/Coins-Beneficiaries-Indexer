export function buildComment(
  tokenContract: string,
  tokenId: bigint,
  sender: string,
  comment: string,
  chainId: number,
  blockNumber: number,
  logIndex: bigint | number,
  timestamp: number,
  txHash: string
) {
  const collection = tokenContract.toLowerCase();
  return {
    id: `${collection}_${tokenId}_${chainId}_${blockNumber}_${logIndex}`,
    sender: sender.toLowerCase(),
    collection,
    token_id: tokenId,
    comment,
    commented_at: timestamp,
    transaction_hash: txHash,
    chain_id: chainId,
  };
}
