import { Address } from "viem";

const getSmartWallet = async (address: Address): Promise<Address | undefined> => {
  try {
    const response = await fetch(
      `https://api.inprocess.world/api/smartwallet?artist_wallet=${address}`
    );
    if (!response.ok) {
      throw new Error("Failed to get smart wallet");
    }
    const data: any = await response.json();
    return data.address;
  } catch (error) {
    console.warn("Failed to get smart wallet", address, error);
    return undefined;
  }
};

export default getSmartWallet;
