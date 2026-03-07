"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        {/* Top white section with hero */}
        <div
          style={{
            backgroundColor: "#ffffff",
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              maxWidth: "600px",
            }}
          >
            <h1
              style={{
                fontSize: "48px",
                fontWeight: "bold",
                color: "#0a1628",
                marginBottom: "20px",
                fontFamily: "var(--font-syne), system-ui, sans-serif",
              }}
            >
              Smart Package Pickup
            </h1>
            <p
              style={{
                fontSize: "18px",
                color: "#9b9892",
                marginBottom: "40px",
              }}
            >
              Schedule pickups. Earn PKU tokens. Climb the leaderboard.
            </p>
            <Link href="/dashboard">
              <button
                style={{
                  backgroundColor: "#e8441a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "4px",
                  padding: "14px 32px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontFamily: "var(--font-syne), system-ui, sans-serif",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#d63810")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#e8441a")}
              >
                Get Started
              </button>
            </Link>
          </div>
        </div>

        {/* Bottom blue section with stats */}
        <div
          style={{
            backgroundColor: "#1a3a6e",
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "24px",
              maxWidth: "1000px",
              width: "100%",
            }}
          >
            {/* Max PKU Supply */}
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "24px",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
            >
              <p
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#0a1628",
                  margin: "0 0 12px 0",
                }}
              >
                1,000,000
              </p>
              <p
                style={{
                  fontSize: "16px",
                  color: "#9b9892",
                  margin: 0,
                }}
              >
                Max PKU Supply
              </p>
            </div>

            {/* Total Pickups */}
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "24px",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
            >
              <p
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#0a1628",
                  margin: "0 0 12px 0",
                }}
              >
                0
              </p>
              <p
                style={{
                  fontSize: "16px",
                  color: "#9b9892",
                  margin: 0,
                }}
              >
                Total Pickups
              </p>
            </div>

            {/* PKU Tokens Minted */}
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "24px",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
            >
              <p
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#0a1628",
                  margin: "0 0 12px 0",
                }}
              >
                0
              </p>
              <p
                style={{
                  fontSize: "16px",
                  color: "#9b9892",
                  margin: 0,
                }}
              >
                PKU Tokens Minted
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}