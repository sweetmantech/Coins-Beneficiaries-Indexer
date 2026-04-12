const transferId = (collection: string, tokenId: string, chainId: number, txHash: string) =>
  `${collection}_${tokenId}_${chainId}_${txHash}`;

export default transferId;
