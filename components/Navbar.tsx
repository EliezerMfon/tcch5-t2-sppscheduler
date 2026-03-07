"use client";

import { connectWallet } from "@/lib/web3";
import { useState } from "react";

export default function Navbar() {
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
    }
  };

  const handleDisconnect = () => {
    setAddress("");
    setError("");
  };

  return (
    <nav
      style={{
        backgroundColor: "#ADD8E6",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingLeft: "20px",
        paddingRight: "20px",
        width: "100%",
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      {address ? (
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <span style={{ color: "#000000", fontSize: "14px" }}>
            Connected: {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <button
            onClick={handleDisconnect}
            style={{
              backgroundColor: "#0066cc",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              padding: "10px 20px",
              fontSize: "14px",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0052a3")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0066cc")}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div>
          <button
            onClick={handleConnect}
            style={{
              backgroundColor: "#0066cc",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              padding: "10px 20px",
              fontSize: "14px",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0052a3")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0066cc")}
          >
            Connect Wallet
          </button>
          {error && (
            <div style={{ color: "#e8441a", fontSize: "12px", marginTop: "5px" }}>
              {error}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}