"use client";

import { useState } from "react";
import { connectWallet } from "@/lib/web3";

export default function WalletConnect() {
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  const handleConnect = async () => {
    try {
      setError("");
      const { address } = await connectWallet();
      setAddress(address);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to connect wallet";
      setError(errorMessage);
      console.error("Wallet connection error:", errorMessage);
    }
  };

  const handleDisconnect = () => {
    setAddress("");
    setError("");
  };

  return (
    <>
      {address ? (
        <button
          onClick={handleDisconnect}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Disconnect ({address.slice(0, 6)}...)
        </button>
      ) : (
        <div>
          <button
            onClick={handleConnect}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Connect Wallet
          </button>
          {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}
        </div>
      )}
    </>
  );
}