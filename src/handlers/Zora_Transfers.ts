import {
  ZoraCreator1155,
  ZoraERC20Minter,
  type ZoraCreator1155_TransferSingle_handlerArgs,
  type ZoraCreator1155_Purchased_handlerArgs,
  type ZoraERC20Minter_ERC20RewardsDeposit_handlerArgs,
} from "generated";
import { zeroAddress } from "viem";
import { handleTransferSingleMint } from "@/lib/zora_protocol/handleTransferSingleMint";
import { handlePurchasedEnrich } from "@/lib/zora_protocol/handlePurchasedEnrich";
import { handleERC20RewardsDepositEnrich } from "@/lib/zora_protocol/handleERC20RewardsDepositEnrich";

ZoraCreator1155.TransferSingle.handler(
  async ({ event, context }: ZoraCreator1155_TransferSingle_handlerArgs) =>
    handleTransferSingleMint(event, context),
  { eventFilters: [{ from: zeroAddress }] }
);

ZoraCreator1155.Purchased.handler(
  async ({ event, context }: ZoraCreator1155_Purchased_handlerArgs) =>
    handlePurchasedEnrich(event, context)
);

ZoraERC20Minter.ERC20RewardsDeposit.handler(
  async ({ event, context }: ZoraERC20Minter_ERC20RewardsDeposit_handlerArgs) =>
    handleERC20RewardsDepositEnrich(event, context)
);
