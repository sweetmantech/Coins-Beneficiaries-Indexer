import { indexer, InProcessMoment, InProcessERC20Minter, type InProcessMoment_TransferSingle_handlerArgs, type InProcessMoment_Purchased_handlerArgs, type InProcessERC20Minter_ERC20RewardsDeposit_handlerArgs } from "envio";
import { zeroAddress } from "viem";
import { handleTransferSingleMint } from "@/lib/zora_protocol/handleTransferSingleMint";
import { handlePurchasedEnrich } from "@/lib/zora_protocol/handlePurchasedEnrich";
import { handleERC20RewardsDepositEnrich } from "@/lib/zora_protocol/handleERC20RewardsDepositEnrich";

indexer.onEvent(
  { contract: "InProcessMoment", event: "TransferSingle", eventFilters: [{ from: zeroAddress }] },
  async ({ event, context }: InProcessMoment_TransferSingle_handlerArgs) =>
    handleTransferSingleMint(event, context)
);

indexer.onEvent(
  { contract: "InProcessMoment", event: "Purchased" },
  async ({ event, context }: InProcessMoment_Purchased_handlerArgs) =>
    handlePurchasedEnrich(event, context)
);

indexer.onEvent(
  { contract: "InProcessERC20Minter", event: "ERC20RewardsDeposit" },
  async ({ event, context }: InProcessERC20Minter_ERC20RewardsDeposit_handlerArgs) =>
    handleERC20RewardsDepositEnrich(event, context)
);
