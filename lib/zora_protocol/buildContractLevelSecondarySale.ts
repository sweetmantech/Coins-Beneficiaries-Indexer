import { type Secondary_Sales } from "envio";

interface SetupNewContractEvent {
  params: {
    defaultRoyaltyConfiguration: readonly [unknown, bigint | number, string];
  };
  chainId: number;
  block: { timestamp: number };
  transaction: { hash: string };
}

export function buildContractLevelSecondarySale(
  collection: string,
  event: SetupNewContractEvent
): Secondary_Sales {
  return {
    id: `${collection}_0_${event.chainId}`,
    collection,
    token_id: 0n,
    royalty_recipient: event.params.defaultRoyaltyConfiguration[2].toLowerCase(),
    royalty_bps: Number(event.params.defaultRoyaltyConfiguration[1]),
    chain_id: event.chainId,
    updated_at: event.block.timestamp,
    transaction_hash: event.transaction.hash,
  };
}
