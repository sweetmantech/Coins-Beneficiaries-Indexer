export const crFactoryAbi = [
  {
    name: "deployReleaseContractWithCalls",
    type: "function",
    inputs: [
      { name: "_artist", type: "address" },
      { name: "_operator", type: "address" },
      { name: "_contractURI", type: "string" },
      { name: "_name", type: "string" },
      { name: "_calls", type: "bytes[]" },
    ],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "payable",
  },
  {
    name: "deployReleaseContractWithCallsDeterministic",
    type: "function",
    inputs: [
      { name: "_artist", type: "address" },
      { name: "_operator", type: "address" },
      { name: "_contractURI", type: "string" },
      { name: "_name", type: "string" },
      { name: "_calls", type: "bytes[]" },
    ],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "nonpayable",
  },
  {
    name: "deployReleaseContractWithCallsDeterministic",
    type: "function",
    inputs: [
      { name: "_artist", type: "address" },
      { name: "_operator", type: "address" },
      { name: "_contractURI", type: "string" },
      { name: "_name", type: "string" },
      { name: "_data", type: "bytes" },
      { name: "_signature", type: "bytes" },
      { name: "_calls", type: "bytes[]" },
    ],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "nonpayable",
  },
] as const;
