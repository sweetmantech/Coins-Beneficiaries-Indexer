interface SetupNewTokenEvent {
  srcAddress: string;
  params: { tokenId: bigint; newURI: string; maxSupply: bigint };
  chainId: number;
  block: { timestamp: number };
  transaction: { hash: string };
}

export function buildMoment(event: SetupNewTokenEvent) {
  const collection = event.srcAddress.toLowerCase();
  const tokenId = event.params.tokenId;
  return {
    id: `${collection}_${tokenId}_${event.chainId}`,
    collection,
    token_id: tokenId,
    max_supply: event.params.maxSupply,
    uri: event.params.newURI,
    chain_id: event.chainId,
    created_at: event.block.timestamp,
    updated_at: event.block.timestamp,
    transaction_hash: event.transaction.hash,
  };
}
