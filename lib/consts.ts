export const SOUND_ADMIN_ROLE = 1;
export const SOUND_MINTER_ROLE = 2;

export const AUTH_SCOPE_OWNER = 1;
export const AUTH_SCOPE_ARTIST = 2;
export const AUTH_SCOPE_MANAGER = 4;

export const FACTORY_ADDRESSES = [
  "0x6832a997d8616707c7b68721d6e9332e77da7f6c",
  "0x540c18b7f99b3b599c6feb99964498931c211858",
  "0x2bf5ebeeb028d5f9e02f0f432ebb1a192f5528f1",
  // Zora CreatorFactory — same address across all chains (deterministic deployment)
  "0x777777c338d93e2c7adf08d102d45ca7cc4ed021",
];

export const USDC_ADDRESSES: Record<number, string> = {
  8453: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  84532: "0x036cbd53842c5426634e7929541ec2318f3dcf7e",
};

export const SAFE_EXEC_TRANSACTION_SELECTOR = "0x6a761202";
export const URL_PREFIXES_HEX = [
  ["68747470733a2f2f", "https://"],
  ["697066733a2f2f", "ipfs://"],
  ["61723a2f2f", "ar://"],
] as const;

export type ZoraMediaUris = {
  tokenURI: string;
  metadataURI: string;
};
