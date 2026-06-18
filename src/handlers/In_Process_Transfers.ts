import {
  InProcessMoment,
  InProcessERC20Minter,
  type InProcessMoment_TransferSingle_handlerArgs,
  type InProcessMoment_Purchased_handlerArgs,
  type InProcessERC20Minter_ERC20RewardsDeposit_handlerArgs,
} from "generated";
import { zeroAddress } from "viem";
import { handleTransferSingleMint } from "@/lib/zora_protocol/handleTransferSingleMint";
import { handlePurchasedEnrich } from "@/lib/zora_protocol/handlePurchasedEnrich";
import { handleERC20RewardsDepositEnrich } from "@/lib/zora_protocol/handleERC20RewardsDepositEnrich";

InProcessMoment.TransferSingle.handler(
  async ({ event, context }: InProcessMoment_TransferSingle_handlerArgs) =>
    handleTransferSingleMint(event, context),
  { eventFilters: [{ from: zeroAddress }] }
);

InProcessMoment.Purchased.handler(
  async ({ event, context }: InProcessMoment_Purchased_handlerArgs) =>
    handlePurchasedEnrich(event, context)
);

InProcessERC20Minter.ERC20RewardsDeposit.handler(
  async ({ event, context }: InProcessERC20Minter_ERC20RewardsDeposit_handlerArgs) =>
    handleERC20RewardsDepositEnrich(event, context)
);
