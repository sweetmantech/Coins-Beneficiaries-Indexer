import { zeroAddress } from "viem";
import type { handlerContext, CatalogRelease1155_TokenPurchased_event } from "generated";
import formatUnits from "../formatUnits";

// Matches USDCFixedPriceController constructor defaults (onlyOwner can change)
const PROTOCOL_FEE_PERCENTAGE = 15n;
const REFERRAL_REWARD_BPS = 5n;

type Payout = {
  recipient: string;
  amount: string;
} | null;

const getUsdcTransfer = async (
  event: CatalogRelease1155_TokenPurchased_event,
  context: handlerContext
): Promise<Payout> => {
  const primarySale = await context.Primary_Sales.get(
    `${event.srcAddress.toLowerCase()}_${event.params.tokenId}_${event.chainId}`
  );

  if (!primarySale) return null;

  const recipient = primarySale.funds_recipient;
  if (recipient === zeroAddress) return null;

  const totalValue = primarySale.price_per_token * event.params.amount;

  // artistShare = value * (100 - protocolFee) / 100
  let artistShare = (totalValue * (100n - PROTOCOL_FEE_PERCENTAGE)) / 100n;

  // referral: deduct if ref0 or ref1 is set
  const hasReferral =
    event.params.referrer0 !== zeroAddress || event.params.referrer1 !== zeroAddress;
  if (hasReferral) {
    const referralShare = (totalValue * REFERRAL_REWARD_BPS) / 100n;
    artistShare -= referralShare;
  }

  const amount = formatUnits(artistShare, 6);
  if (amount === "0.000000") return null;

  return { recipient, amount };
};

export default getUsdcTransfer;
