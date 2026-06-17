import { ZoraCreator1155, type ZoraCreator1155_TransferSingle_handlerArgs } from "generated";
import { zeroAddress } from "viem";
import { handleTransferSingleMint } from "@/lib/zora_protocol/handleTransferSingleMint";

ZoraCreator1155.TransferSingle.handler(
  async ({ event, context }: ZoraCreator1155_TransferSingle_handlerArgs) =>
    handleTransferSingleMint(event, context),
  { eventFilters: [{ from: zeroAddress }] }
);
