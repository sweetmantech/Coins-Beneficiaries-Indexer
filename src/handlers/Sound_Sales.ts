import {
  SuperMinterV2,
  SoundEditionV2_1,
  type SuperMinterV2_MintCreated_handlerArgs,
  type SuperMinterV2_PriceSet_handlerArgs,
  type SuperMinterV2_TimeRangeSet_handlerArgs,
  type SuperMinterV2_MaxMintablePerAccountSet_handlerArgs,
  type SoundEditionV2_1_FundingRecipientSet_handlerArgs,
  type SoundEditionV2_1_RoyaltySet_handlerArgs,
} from "generated";
import getLatestSale from "@/lib/sound_sales/getLatestSale";

SuperMinterV2.MintCreated.handler(
  async ({ event, context }: SuperMinterV2_MintCreated_handlerArgs) => {
    const latestSale = await getLatestSale(event, context);
    context.Primary_Sales.set(latestSale);
  }
);

SuperMinterV2.PriceSet.handler(async ({ event, context }: SuperMinterV2_PriceSet_handlerArgs) => {
  const edition = event.params.edition.toLowerCase();
  const entityId = `${edition}_${event.params.tier}_${event.params.scheduleNum}_${event.chainId}`;
  const existing = await context.Primary_Sales.get(entityId);
  if (!existing) return;
  context.Primary_Sales.set({ ...existing, price_per_token: event.params.price });
});

SuperMinterV2.TimeRangeSet.handler(
  async ({ event, context }: SuperMinterV2_TimeRangeSet_handlerArgs) => {
    const edition = event.params.edition.toLowerCase();
    const entityId = `${edition}_${event.params.tier}_${event.params.scheduleNum}_${event.chainId}`;
    const existing = await context.Primary_Sales.get(entityId);
    if (!existing) return;
    context.Primary_Sales.set({
      ...existing,
      sale_start: BigInt(event.params.startTime),
      sale_end: BigInt(event.params.endTime),
    });
  }
);

SuperMinterV2.MaxMintablePerAccountSet.handler(
  async ({ event, context }: SuperMinterV2_MaxMintablePerAccountSet_handlerArgs) => {
    const edition = event.params.edition.toLowerCase();
    const entityId = `${edition}_${event.params.tier}_${event.params.scheduleNum}_${event.chainId}`;
    const existing = await context.Primary_Sales.get(entityId);
    if (!existing) return;
    context.Primary_Sales.set({
      ...existing,
      max_tokens_per_address: BigInt(event.params.value),
    });
  }
);

SoundEditionV2_1.FundingRecipientSet.handler(
  async ({ event, context }: SoundEditionV2_1_FundingRecipientSet_handlerArgs) => {
    const address = event.srcAddress.toLowerCase();
    const recipient = event.params.recipient.toLowerCase();
    const chainId = event.chainId;

    // Update Sound_Editions
    const edition = await context.Sound_Editions.get(`${address}_${chainId}`);
    if (edition) {
      context.Sound_Editions.set({
        ...edition,
        funding_recipient: recipient,
        updated_at: event.block.timestamp,
        transaction_hash: event.transaction.hash,
      });
    }

    // Update Secondary_Sales
    const secondary = await context.Secondary_Sales.get(`${address}_0_${chainId}`);
    if (secondary) {
      context.Secondary_Sales.set({
        ...secondary,
        royalty_recipient: recipient,
        updated_at: event.block.timestamp,
        transaction_hash: event.transaction.hash,
      });
    }

    // Update Primary_Sales for all schedules on this edition
    const primarySales = await context.Primary_Sales.getWhere.collection.eq(address);
    for (const primarySale of primarySales) {
      if (primarySale.chain_id !== chainId) continue;
      context.Primary_Sales.set({ ...primarySale, funds_recipient: recipient });
    }
  }
);

SoundEditionV2_1.RoyaltySet.handler(
  async ({ event, context }: SoundEditionV2_1_RoyaltySet_handlerArgs) => {
    const address = event.srcAddress.toLowerCase();
    const bps = Number(event.params.bps);
    const chainId = event.chainId;

    // Update Sound_Editions
    const edition = await context.Sound_Editions.get(`${address}_${chainId}`);
    if (edition) {
      context.Sound_Editions.set({
        ...edition,
        royalty_bps: bps,
        updated_at: event.block.timestamp,
        transaction_hash: event.transaction.hash,
      });
    }

    // Update Secondary_Sales
    const secondary = await context.Secondary_Sales.get(`${address}_0_${chainId}`);
    if (secondary) {
      context.Secondary_Sales.set({
        ...secondary,
        royalty_bps: bps,
        updated_at: event.block.timestamp,
        transaction_hash: event.transaction.hash,
      });
    }
  }
);
