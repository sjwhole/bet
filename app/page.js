"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

// ABI of your deployed contract
const contractABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "player",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "betOnYes",
        type: "bool",
      },
    ],
    name: "BetPlaced",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bool",
        name: "result",
        type: "bool",
      },
    ],
    name: "ResultDeclared",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "player",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "WinningsPaid",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "bool",
        name: "_betOnYes",
        type: "bool",
      },
    ],
    name: "bet",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "bettingOpen",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "closeBetting",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bool",
        name: "_result",
        type: "bool",
      },
    ],
    name: "declareResult",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "finalResult",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getContractBalance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "numberOfBets",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "playerInfo",
    outputs: [
      {
        internalType: "uint256",
        name: "amountBet",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "betOnYes",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "players",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "resultDeclared",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalBetsNo",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalBetsYes",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const contractAddress = "0x2181c1f395dF092127c72eA3ac196175e265b034";
const HOLESKY_CHAIN_ID = "0x4268"; // Chain ID for Holesky in hexadecimal

function Home() {
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [betAmount, setBetAmount] = useState("");
  const [betChoice, setBetChoice] = useState("yes");
  const [bettingOpen, setBettingOpen] = useState(true);
  const [totalBetsYes, setTotalBetsYes] = useState(0);
  const [totalBetsNo, setTotalBetsNo] = useState(0);
  const [loading, setLoading] = useState(false);
  const [networkStatus, setNetworkStatus] = useState("");

  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(provider);

          await checkAndSwitchToHolesky(provider);

          const signer = await provider.getSigner();
          const contract = new ethers.Contract(
            contractAddress,
            contractABI,
            signer
          );

          setContract(contract);
          setAccount(await signer.getAddress());

          // Get initial contract state
          const bettingOpen = await contract.bettingOpen();
          const totalBetsYes = await contract.totalBetsYes();
          const totalBetsNo = await contract.totalBetsNo();

          setBettingOpen(bettingOpen);
          setTotalBetsYes(ethers.formatEther(totalBetsYes));
          setTotalBetsNo(ethers.formatEther(totalBetsNo));

          // Listen for events
          contract.on("BetPlaced", (player, amount, betOnYes) => {
            if (betOnYes) {
              setTotalBetsYes(
                (prev) => Number(prev) + Number(ethers.formatEther(amount))
              );
            } else {
              setTotalBetsNo(
                (prev) => Number(prev) + Number(ethers.formatEther(amount))
              );
            }
          });
        } catch (error) {
          console.error("An error occurred", error);
          setNetworkStatus("Error initializing: " + error.message);
        }
      } else {
        setNetworkStatus("Please install MetaMask!");
      }
    };

    init();

    return () => {
      if (contract) {
        contract.removeAllListeners();
      }
    };
  }, []);

  const checkAndSwitchToHolesky = async (provider) => {
    try {
      const network = await provider.getNetwork();
      if (network.chainId !== BigInt(HOLESKY_CHAIN_ID)) {
        setNetworkStatus("Switching to Holesky network...");
        await switchToHolesky();
      } else {
        setNetworkStatus("Connected to Holesky network");
      }
    } catch (error) {
      console.error("Error checking or switching network:", error);
      setNetworkStatus("Error checking or switching network: " + error.message);
    }
  };

  const switchToHolesky = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: HOLESKY_CHAIN_ID }],
      });
      setNetworkStatus("Successfully switched to Holesky network");
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await addHoleskyNetwork();
        } catch (addError) {
          console.error("Error adding Holesky network:", addError);
          setNetworkStatus("Error adding Holesky network: " + addError.message);
        }
      } else {
        console.error("Error switching to Holesky network:", switchError);
        setNetworkStatus(
          "Error switching to Holesky network: " + switchError.message
        );
      }
    }
  };

  const addHoleskyNetwork = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: HOLESKY_CHAIN_ID,
            chainName: "Holesky Testnet",
            nativeCurrency: {
              name: "Holesky ETH",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: ["https://ethereum-holesky.publicnode.com"],
            blockExplorerUrls: ["https://holesky.etherscan.io"],
          },
        ],
      });
      setNetworkStatus("Holesky network added successfully");
    } catch (error) {
      console.error("Error adding Holesky network:", error);
      setNetworkStatus("Error adding Holesky network: " + error.message);
      throw error;
    }
  };

  const placeBet = async (e) => {
    e.preventDefault();
    if (!contract) return;

    setLoading(true);
    try {
      const tx = await contract.bet(betChoice === "yes", {
        value: ethers.parseEther(betAmount),
      });
      await tx.wait();
      console.log("Bet placed successfully!");
      setNetworkStatus("Bet placed successfully!");
    } catch (error) {
      console.error("Error placing bet:", error);
      setNetworkStatus("Error placing bet: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div>
              <h1 className="text-2xl font-semibold">온다 ? 안온다?</h1>
            </div>
            <div className="mt-4 text-sm text-gray-600">{networkStatus}</div>
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <p>Total Bets on Yes: {totalBetsYes} ETH</p>
                <p>Total Bets on No: {totalBetsNo} ETH</p>
                <p>Betting is currently: {bettingOpen ? "Open" : "Closed"}</p>
              </div>
              {bettingOpen && (
                <div className="pt-6 text-base leading-6 font-bold sm:text-lg sm:leading-7">
                  <form onSubmit={placeBet}>
                    <div className="mb-4">
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor="betAmount"
                      >
                        Bet Amount (ETH)
                      </label>
                      <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="betAmount"
                        type="number"
                        step="0.01"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor="betChoice"
                      >
                        Bet On
                      </label>
                      <select
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="betChoice"
                        value={betChoice}
                        onChange={(e) => setBetChoice(e.target.value)}
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                          loading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? "Placing Bet..." : "Place Bet"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
