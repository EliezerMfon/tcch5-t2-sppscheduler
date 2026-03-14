import Navbar from "@/components/Navbar";
import WalletConnect from "@/components/WalletConnect";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Navbar />

      {/* Hero — white top half */}
      <div style={{ background: "#ffffff", padding: "80px 24px 60px", textAlign: "center" }}>
        <h1 style={{
          fontSize: 48, fontWeight: 800, color: "#0a1628",
          letterSpacing: -1, marginBottom: 16, fontFamily: "Syne, sans-serif"
        }}>
          Smart Package Pickup
        </h1>
        <p style={{
          fontSize: 18, color: "#9b9892", marginBottom: 40,
          fontFamily: "Syne, sans-serif"
        }}>
          Schedule pickups. Earn PKU tokens. Climb the leaderboard.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          <WalletConnect />
          <Link href="/dashboard">
            <button style={{
              background: "#e8441a", color: "#fff", border: "none",
              padding: "12px 32px", borderRadius: 6, fontSize: 15,
              fontWeight: 700, fontFamily: "Syne, sans-serif",
              cursor: "pointer", letterSpacing: 0.5
            }}>
              Get Started →
            </button>
          </Link>
        </div>
      </div>

      {/* Stats — blue bottom half */}
      <div style={{
        background: "#1a3a6e", padding: "60px 24px",
        display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap"
      }}>
        {[
          { val: "1,000,000", label: "Max PKU Supply" },
          { val: "0",         label: "Total Pickups" },
          { val: "0",         label: "PKU Tokens Minted" },
        ].map(({ val, label }) => (
          <div key={label} style={{
            background: "#fff", borderRadius: 8, padding: 24,
            minWidth: 200, textAlign: "center",
            boxShadow: "0 4px 24px rgba(0,0,0,0.10)"
          }}>
            <div style={{
              fontSize: 32, fontWeight: 800, color: "#0a1628",
              fontFamily: "Syne, sans-serif", letterSpacing: -1
            }}>
              {val}
            </div>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 2,
              textTransform: "uppercase", color: "#9b9892",
              marginTop: 6, fontFamily: "Syne, sans-serif"
            }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}