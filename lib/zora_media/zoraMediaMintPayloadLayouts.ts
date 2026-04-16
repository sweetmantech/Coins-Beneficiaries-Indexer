const mediaDataComponents = [
  { name: "tokenURI", type: "string" },
  { name: "metadataURI", type: "string" },
  { name: "contentHash", type: "bytes32" },
  { name: "metadataHash", type: "bytes32" },
] as const;

const bidShareComponents = [
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
] as const;

const zoraMediaMintPayloadLayouts = [
  [
    {
      name: "data",
      type: "tuple",
      components: mediaDataComponents,
    },
    {
      name: "bidShares",
      type: "tuple",
      components: bidShareComponents,
    },
  ],
  [
    {
      name: "data",
      type: "tuple",
      components: mediaDataComponents,
    },
    { name: "prevOwner", type: "uint256" },
    { name: "creator", type: "uint256" },
    { name: "owner", type: "uint256" },
  ],
  [
    { name: "creator", type: "address" },
    {
      name: "data",
      type: "tuple",
      components: mediaDataComponents,
    },
    {
      name: "bidShares",
      type: "tuple",
      components: bidShareComponents,
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
] as const;

export default zoraMediaMintPayloadLayouts;
