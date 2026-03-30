import getCollectionEntity from "@/lib/in_process_collections/getEntity";
import getAirdropEntity from "@/lib/in_process_airdrops/getEntity";
import {
  InProcessMoment,
  type InProcessMoment_TransferSingle_handlerArgs,
  type Collectors,
} from "generated";
import { Address, zeroAddress } from "viem";
import getSmartWallet from "@/lib/getSmartWallet";

InProcessMoment.TransferSingle.handler(
  async ({ event, context }: InProcessMoment_TransferSingle_handlerArgs) => {
    const collection = await getCollectionEntity(event, context);
    if (!collection) {
      return;
    }
    const defaultAdmin = collection.default_admin;
    const smartwallet = await getSmartWallet(defaultAdmin as Address);
    const operator = event.params.operator.toLowerCase();

    if (operator === defaultAdmin || operator === smartwallet) {
      const airdropEntity = await getAirdropEntity(event, context);
      context.InProcess_Airdrops.set(airdropEntity);
    }

    const collectEntity: Collectors = {
      id: `${event.srcAddress.toLowerCase()}_${event.params.id.toString()}_${event.chainId}_${event.block.number}_${event.logIndex}`,
      collection: event.srcAddress.toLowerCase(),
      token_id: event.params.id,
      amount: event.params.value,
      chain_id: event.chainId,
      collector: event.params.to.toLowerCase(),
      transaction_hash: event.transaction.hash,
      collected_at: event.block.timestamp,
    };
    context.Collectors.set(collectEntity);
  },
  {
    eventFilters: [
      {
        from: zeroAddress,
      },
    ],
  }
);
