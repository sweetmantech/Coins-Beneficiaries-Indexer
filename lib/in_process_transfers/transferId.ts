/** One mint log per row: (...tx..., logIndex) disambiguates multiple TransferSingle mints in the same tx). */
const transferId = (
  collection: string,
  tokenId: string,
  chainId: number,
  txHash: string,
  logIndex: number
) => `${collection}_${tokenId}_${chainId}_${txHash}_${logIndex}`;

export default transferId;
