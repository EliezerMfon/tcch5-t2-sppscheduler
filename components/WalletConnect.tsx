"use client";

import { useState } from "react";
import { connectWallet } from "@/lib/web3";

export default function WalletConnect() {
  const [address, setAddress] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    try {
      setError("");
      setLoading(true);
      const { address } = await connectWallet();
      setAddress(address);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to connect wallet";
      setError(errorMessage);
    } finally {
      setLoading(false);
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
          Disconnect ({address.slice(0, 6)}...{address.slice(-4)})
        </button>
      ) : (
        <div>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Connecting…" : "Connect Wallet"}
          </button>
          {error && (
            <p className="text-red-600 mt-2 text-sm max-w-xs">{error}</p>
          )}
        </div>
      )}
    </>
  );
}