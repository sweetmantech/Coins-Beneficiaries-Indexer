import { Address, erc20Abi, Hash, parseEventLogs, zeroAddress } from "viem";
import { InProcessERC20Minter_ERC20RewardsDeposit_event } from "generated";
import formatUnits from "../formatUnits";
import getTransactionReceipt from "../viem/getTransactionReceipt";

type UsdcTransfer = {
  from?: Address;
  to?: Address;
  value?: bigint;
};

type Payout = {
  recipient: Address;
  amount: string;
  spender: Address;
};

const getUsdcTransfer = async (
  event: InProcessERC20Minter_ERC20RewardsDeposit_event
): Promise<Payout> => {
  try {
    const receipt = await getTransactionReceipt(event.transaction.hash as Hash, event.chainId);

    const decodedLogs = parseEventLogs({
      abi: erc20Abi,
      logs: receipt.logs,
      strict: false, // ignore logs not found in the provided ABI
    });

    const erc20MinterAddresses = [
      "0x4538d7a07227d21597fb851a14057f00d15b4d5e".toLowerCase(),
      "0xE27d9Dc88dAB82ACa3ebC49895c663C6a0CfA014".toLowerCase(),
    ];

    // Only consider ERC20 Transfer logs with non-zero value
    const transferLogs = decodedLogs.filter((log) => {
      const isTransfer = (log as any).eventName === "Transfer";
      const value = (log as any).args?.value as bigint | undefined;
      return isTransfer && typeof value === "bigint" && value !== 0n;
    });

    // Outgoing from minter (recipient we care about)
    const outgoing = transferLogs.find((log) => {
      const from = (log as any).args?.from as string | undefined;
      return typeof from === "string" && erc20MinterAddresses.includes(from.toLowerCase());
    });

    // Incoming to minter (spender we care about)
    const incoming = transferLogs.find((log) => {
      const to = (log as any).args?.to as string | undefined;
      return typeof to === "string" && erc20MinterAddresses.includes(to.toLowerCase());
    });

    const rawAmount = ((outgoing?.args as UsdcTransfer | undefined)?.value ?? 0n) as bigint;
    const amount = formatUnits(rawAmount, 6);
    const recipient = ((outgoing?.args as UsdcTransfer | undefined)?.to ?? zeroAddress) as Address;
    const spender = ((incoming?.args as UsdcTransfer | undefined)?.from ?? zeroAddress) as Address;

    return { recipient, amount, spender };
  } catch (err) {
    console.warn("Failed to fetch/parse logs for tx", event.transaction.hash, err);
    return {
      recipient: zeroAddress,
      amount: "0.000000",
      spender: zeroAddress,
    };
  }
};

export default getUsdcTransfer;
