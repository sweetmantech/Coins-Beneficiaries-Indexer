import { Address, Hash, toHex, zeroAddress, keccak256, toBytes, decodeEventLog } from "viem";
import { InProcessMoment_Purchased_event, InProcess_Moment_Comments } from "generated";
import getTransactionReceipt from "./viem/getTransactionReceipt";
import { mintCommentAbi } from "./abi/mintCommentAbi";

type PurchaseRecipientAndCommentResult = {
  recipient: Address;
  mintComment: InProcess_Moment_Comments | null;
};

const extractPurchaseRecipientAndComment = async (
  event: InProcessMoment_Purchased_event
): Promise<PurchaseRecipientAndCommentResult> => {
  try {
    const receipt = await getTransactionReceipt(event.transaction.hash as Hash, event.chainId);

    // Convert event.value to hex format (padded to 64 characters for uint256)
    const eventValueHex = toHex(event.params.value, { size: 32 });

    // Filter logs where data hex equals event.value
    const matchingLogs = receipt.logs.filter((log) => {
      return log.data.toLowerCase() === eventValueHex.toLowerCase();
    });

    const recipient = matchingLogs.length === 0 ? zeroAddress : matchingLogs[0].address;

    // Compute MintComment event signature hash
    const mintCommentEventSignature = "MintComment(address,address,uint256,uint256,string)";
    const mintCommentEventHash = keccak256(toBytes(mintCommentEventSignature));

    const mintCommentLog = receipt.logs.find(
      (log) => log.topics[0]?.toLowerCase() === mintCommentEventHash.toLowerCase()
    );

    let mintComment: InProcess_Moment_Comments | null = null;
    if (mintCommentLog) {
      const decoded = decodeEventLog({
        abi: mintCommentAbi,
        data: mintCommentLog.data,
        topics: mintCommentLog.topics,
      });
      const args = decoded.args as any;
      mintComment = {
        id: `${args.tokenContract.toLowerCase()}_${args.tokenId}_${event.chainId}_${receipt.blockNumber}_${mintCommentLog.logIndex}`,
        sender: args.sender.toLowerCase(),
        collection: args.tokenContract.toLowerCase(),
        token_id: args.tokenId,
        comment: args.comment,
        commented_at: event.block.timestamp,
        transaction_hash: event.transaction.hash,
        chain_id: event.chainId,
      };
    }

    return { recipient, mintComment };
  } catch (err) {
    console.warn("Failed to fetch/parse logs for tx", event.transaction.hash, err);
    return { recipient: zeroAddress, mintComment: null };
  }
};

export default extractPurchaseRecipientAndComment;
