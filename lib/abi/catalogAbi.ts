export const abi = [
  {
    name: "tokenInfo",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_tokenId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "artist", type: "address" },
          { name: "contentHash", type: "bytes32" },
          {
            name: "uri",
            type: "tuple",
            components: [
              { name: "arweaveURI", type: "bytes32" },
              { name: "normal", type: "string" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "tokenPrice",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_tokenId", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
] as const;
