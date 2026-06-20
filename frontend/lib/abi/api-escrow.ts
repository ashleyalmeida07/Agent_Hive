export const apiEscrowAbi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "purchaseId", type: "bytes32" },
      { internalType: "bytes32", name: "apiId",      type: "bytes32" },
    ],
    name: "stakeForAPI",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "purchaseId", type: "bytes32" }],
    name: "withdrawStake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "purchaseId", type: "bytes32" }],
    name: "logUsage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "sweep",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "apiId", type: "bytes32" }],
    name: "apiSellers",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "purchaseId", type: "bytes32" }],
    name: "getStake",
    outputs: [
      {
        components: [
          { internalType: "address", name: "buyer",      type: "address" },
          { internalType: "bytes32", name: "apiId",      type: "bytes32" },
          { internalType: "uint256", name: "amount",     type: "uint256" },
          { internalType: "uint256", name: "usageCount", type: "uint256" },
          { internalType: "bool",    name: "active",     type: "bool"    },
        ],
        internalType: "struct APIEscrow.Stake",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "purchaseId", type: "bytes32" }],
    name: "isActive",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "STAKE_AMOUNT",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true,  internalType: "bytes32", name: "purchaseId", type: "bytes32" },
      { indexed: true,  internalType: "address", name: "buyer",      type: "address" },
      { indexed: true,  internalType: "bytes32", name: "apiId",      type: "bytes32" },
      { indexed: false, internalType: "uint256", name: "amount",     type: "uint256" },
    ],
    name: "Staked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true,  internalType: "bytes32", name: "purchaseId", type: "bytes32" },
      { indexed: false, internalType: "uint256", name: "newCount",   type: "uint256" },
    ],
    name: "UsageLogged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true,  internalType: "bytes32", name: "purchaseId", type: "bytes32" },
      { indexed: true,  internalType: "address", name: "buyer",      type: "address" },
      { indexed: false, internalType: "uint256", name: "amount",     type: "uint256" },
    ],
    name: "Withdrawn",
    type: "event",
  },
] as const;
