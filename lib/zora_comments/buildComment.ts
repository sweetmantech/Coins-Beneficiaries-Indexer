import { type Zora_Comments } from "generated";

const buildComment = (
  tokenContract: string,
  tokenId: bigint,
  sender: string,
  comment: string,
  chainId: number,
  blockNumber: number,
  logIndex: number,
  timestamp: number,
  txHash: string
): Zora_Comments => ({
  id: `${tokenContract.toLowerCase()}_${tokenId}_${chainId}_${blockNumber}_${logIndex}`,
  sender: sender.toLowerCase(),
  collection: tokenContract.toLowerCase(),
  token_id: tokenId,
  comment,
  commented_at: timestamp,
  transaction_hash: txHash,
  chain_id: chainId,
});

export default buildComment;
