import { type Secondary_Sales } from "envio";

interface UpdatedRoyaltiesEvent {
  srcAddress: string;
  params: { tokenId: bigint; configuration: readonly [unknown, bigint | number, string] };
  chainId: number;
  block: { timestamp: number };
  transaction: { hash: string };
}

interface Context {
  Secondary_Sales: { set: (entity: Secondary_Sales) => void };
}

export function handleUpdatedRoyalties(event: UpdatedRoyaltiesEvent, context: Context) {
  const collection = event.srcAddress.toLowerCase();
  const tokenId = event.params.tokenId;
  context.Secondary_Sales.set({
    id: `${collection}_${tokenId}_${event.chainId}`,
    collection,
    token_id: tokenId,
    royalty_recipient: event.params.configuration[2].toLowerCase(),
    royalty_bps: Number(event.params.configuration[1]),
    chain_id: event.chainId,
    updated_at: event.block.timestamp,
    transaction_hash: event.transaction.hash,
  });
}
