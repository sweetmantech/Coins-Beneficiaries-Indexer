interface SetupNewContractEvent {
  params: {
    newContract: string;
    name: string;
    contractURI: string;
    defaultAdmin: string;
  };
  chainId: number;
  block: { timestamp: number };
  transaction: { hash: string };
}

export function buildCollection(event: SetupNewContractEvent) {
  const collection = event.params.newContract.toLowerCase();
  return {
    id: `${collection}_${event.chainId}`,
    address: collection,
    name: event.params.name,
    uri: event.params.contractURI,
    default_admin: event.params.defaultAdmin.toLowerCase(),
    chain_id: event.chainId,
    created_at: event.block.timestamp,
    updated_at: event.block.timestamp,
    transaction_hash: event.transaction.hash,
  };
}
