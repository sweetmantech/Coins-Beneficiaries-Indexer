export const zoraMediaMintAbi = [
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "data",
        type: "tuple",
        components: [
          { name: "tokenURI", type: "string" },
          { name: "metadataURI", type: "string" },
          { name: "contentHash", type: "bytes32" },
          { name: "metadataHash", type: "bytes32" },
        ],
      },
      {
        name: "bidShares",
        type: "tuple",
        components: [
          {
            name: "prevOwner",
            type: "tuple",
            components: [{ name: "value", type: "uint256" }],
          },
          {
            name: "creator",
            type: "tuple",
            components: [{ name: "value", type: "uint256" }],
          },
          {
            name: "owner",
            type: "tuple",
            components: [{ name: "value", type: "uint256" }],
          },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "mintWithSig",
    stateMutability: "nonpayable",
    inputs: [
      { name: "creator", type: "address" },
      {
        name: "data",
        type: "tuple",
        components: [
          { name: "tokenURI", type: "string" },
          { name: "metadataURI", type: "string" },
          { name: "contentHash", type: "bytes32" },
          { name: "metadataHash", type: "bytes32" },
        ],
      },
      {
        name: "bidShares",
        type: "tuple",
        components: [
          {
            name: "prevOwner",
            type: "tuple",
            components: [{ name: "value", type: "uint256" }],
          },
          {
            name: "creator",
            type: "tuple",
            components: [{ name: "value", type: "uint256" }],
          },
          {
            name: "owner",
            type: "tuple",
            components: [{ name: "value", type: "uint256" }],
          },
        ],
      },
      {
        name: "sig",
        type: "tuple",
        components: [
          { name: "deadline", type: "uint256" },
          { name: "v", type: "uint8" },
          { name: "r", type: "bytes32" },
          { name: "s", type: "bytes32" },
        ],
      },
    ],
    outputs: [],
  },
] as const;
