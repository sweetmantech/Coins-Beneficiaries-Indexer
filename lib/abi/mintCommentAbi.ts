export const mintCommentAbi = [
  {
    type: "event",
    name: "MintComment",
    inputs: [
      { type: "address", indexed: true, name: "sender" },
      { type: "address", indexed: true, name: "tokenContract" },
      { type: "uint256", indexed: true, name: "tokenId" },
      { type: "uint256", indexed: false, name: "quantity" },
      { type: "string", indexed: false, name: "comment" },
    ],
  },
] as const;
