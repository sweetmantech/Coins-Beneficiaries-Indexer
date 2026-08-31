import {
  InPublic1155,
  type InPublic1155_TransferSingle_handlerArgs,
  type InPublic1155_TransferBatch_handlerArgs,
} from "generated";
import { zeroAddress } from "viem";
import { handleTransferSingleMint } from "@/lib/zora_protocol/handleTransferSingleMint";
import { handleTransferBatch } from "@/lib/zora_protocol/handleTransferBatch";

InPublic1155.TransferSingle.handler(
  async ({ event, context }: InPublic1155_TransferSingle_handlerArgs) => {
    if (event.params.to.toLowerCase() === zeroAddress) return;
    handleTransferSingleMint(event, context);
  }
);

InPublic1155.TransferBatch.handler(
  async ({ event, context }: InPublic1155_TransferBatch_handlerArgs) =>
    handleTransferBatch(event, context)
);
