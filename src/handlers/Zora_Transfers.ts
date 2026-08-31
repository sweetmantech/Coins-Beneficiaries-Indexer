import {
  ZoraCreator1155,
  ZoraCreator1155Legacy,
  type ZoraCreator1155_TransferSingle_handlerArgs,
  type ZoraCreator1155_TransferBatch_handlerArgs,
  type ZoraCreator1155Legacy_TransferSingle_handlerArgs,
  type ZoraCreator1155Legacy_TransferBatch_handlerArgs,
} from "generated";
import { zeroAddress } from "viem";
import { handleTransferSingleMint } from "@/lib/zora_protocol/handleTransferSingleMint";
import { handleTransferBatch } from "@/lib/zora_protocol/handleTransferBatch";

ZoraCreator1155.TransferSingle.handler(
  async ({ event, context }: ZoraCreator1155_TransferSingle_handlerArgs) => {
    if (event.params.to.toLowerCase() === zeroAddress) return;
    handleTransferSingleMint(event, context);
  }
);

ZoraCreator1155Legacy.TransferSingle.handler(
  async ({ event, context }: ZoraCreator1155Legacy_TransferSingle_handlerArgs) => {
    if (event.params.to.toLowerCase() === zeroAddress) return;
    handleTransferSingleMint(event, context);
  }
);

ZoraCreator1155.TransferBatch.handler(
  async ({ event, context }: ZoraCreator1155_TransferBatch_handlerArgs) =>
    handleTransferBatch(event, context)
);

ZoraCreator1155Legacy.TransferBatch.handler(
  async ({ event, context }: ZoraCreator1155Legacy_TransferBatch_handlerArgs) =>
    handleTransferBatch(event, context)
);
