"use client";

import { useState, useEffect } from "react";

// ─── TIMESTAMP UTILITIES ────────────────────────────────────────────────────
function formatLocalDateTime(isoString: string): string {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatLeaderboardDate(isoString: string): string {
  if (!isoString) return "—";
  const d = new Date(isoString);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatLeaderboardTime(isoString: string): string {
  if (!isoString) return "—";
  const d = new Date(isoString);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

function timeAgo(isoString: string): string {
  if (!isoString) return "";
  const seconds = Math.floor(
    (Date.now() - new Date(isoString).getTime()) / 1000
  );
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function buildScheduledAtISO(dateStr: string, timeSlot: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeSlot.split(":").map(Number);
  const localDate = new Date(year, month - 1, day, hour, minute, 0, 0);
  return localDate.toISOString();
}

// ─── TYPES ──────────────────────────────────────────────────────────────────
interface LeaderboardEntry {
  rank: number;
  id: string;
  address: string;
  pickups: number;
  tokens: number;
  lastPickupAt: string;
}

interface PickupData {
  id: string;
  senderName: string;
  address: string;
  notes: string;
  scheduledAt: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  txHash: string;
  tokensMinted: number | null;
}

interface StatsData {
  totalPickups: number;
  totalTokensMinted: number;
  maxSupply: number;
}

interface PickupSchedulerProps {
  initialLeaderboard: LeaderboardEntry[];
  stats: StatsData;
}

// ─── TIME SLOT CONSTANTS ────────────────────────────────────────────────────
const TIME_SLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
const UNAVAILABLE_SLOTS = ["10:00", "15:00"];

// ─── REFRESH HOOK TO FORCE RERENDER FOR TIMEAGO ────────────────────────────
function useTick(intervalMs: number = 30000): void {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function PickupScheduler({
  initialLeaderboard,
  stats,
}: PickupSchedulerProps) {
  const [tab, setTab] = useState<"booking" | "leaderboard">("booking");
  const [form, setForm] = useState({
    sender: "",
    address: "",
    date: "",
    notes: "",
  });
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState<PickupData | null>(null);
  const [agentConfirmed, setAgentConfirmed] = useState(false);
  const [pendingPickup, setPendingPickup] = useState<PickupData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(initialLeaderboard);
  const [currentStats, setCurrentStats] = useState(stats);
  const [error, setError] = useState("");

  useTick(30000); // Refresh timeAgo every 30 seconds

  const ready = form.sender && form.address && form.date && selectedTime;

  const handleBook = async (): Promise<void> => {
    if (!ready) return;
    setLoading(true);
    setError("");

    try {
      const userId = "user-" + Math.random().toString(36).slice(7); // Mock user ID
      const scheduledAt = buildScheduledAtISO(form.date, selectedTime!);

      const response = await fetch("/api/pickups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          senderName: form.sender,
          address: form.address,
          notes: form.notes,
          scheduledAt,
        }),
      });

      if (!response.ok) throw new Error("Failed to create pickup");

      const pickup = await response.json();
      const pickupData: PickupData = {
        id: pickup.id,
        senderName: pickup.senderName,
        address: pickup.address,
        notes: pickup.notes,
        scheduledAt: pickup.scheduledAt,
        createdAt: pickup.createdAt,
        updatedAt: pickup.updatedAt,
        status: pickup.status,
        txHash: pickup.txHash,
        tokensMinted: null,
      };

      setConfirmed(pickupData);
      setPendingPickup(pickupData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to book pickup";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAgentConfirm = async (): Promise<void> => {
    if (!pendingPickup) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/pickups/${pendingPickup.id}/confirm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to confirm pickup");

      const confirmedAt = new Date().toISOString();
      setConfirmed((prev) => ({
        ...(prev as PickupData),
        status: "CONFIRMED",
        updatedAt: confirmedAt,
        tokensMinted: 100,
      }));
      setAgentConfirmed(true);
      setPendingPickup(null);

      // Update leaderboard and stats
      setLeaderboard((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[0] = {
            ...updated[0],
            pickups: updated[0].pickups + 1,
            tokens: updated[0].tokens + 100,
            lastPickupAt: confirmedAt,
          };
        }
        return updated;
      });

      setCurrentStats((prev) => ({
        ...prev,
        totalPickups: prev.totalPickups + 1,
        totalTokensMinted: prev.totalTokensMinted + 100,
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to confirm pickup";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        fontFamily: "var(--font-syne), system-ui, sans-serif",
        backgroundColor: "#ffffff",
        color: "#0a1628",
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: "#0a1628",
          padding: "18px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "3px solid #e8441a",
          position: "sticky",
          top: 64,
          zIndex: 100,
        }}
      >
        <div style={{ fontSize: "18px", fontWeight: 800, color: "#ffffff" }}>
          PKU<span style={{ color: "#e8441a" }}>•</span>CHAIN
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid #1a1a22",
          backgroundColor: "#0a1628",
          padding: "0 40px",
        }}
      >
        <button
          onClick={() => setTab("booking")}
          style={{
            padding: "14px 28px",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: tab === "booking" ? "#ffffff" : "#9b9892",
            backgroundColor: "transparent",
            border: "none",
            borderBottom: tab === "booking" ? "3px solid #e8441a" : "3px solid transparent",
            cursor: "pointer",
            fontFamily: "var(--font-syne), system-ui, sans-serif",
          }}
        >
          Book Pickup
        </button>
        <button
          onClick={() => setTab("leaderboard")}
          style={{
            padding: "14px 28px",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: tab === "leaderboard" ? "#ffffff" : "#9b9892",
            backgroundColor: "transparent",
            border: "none",
            borderBottom: tab === "leaderboard" ? "3px solid #e8441a" : "3px solid transparent",
            cursor: "pointer",
            fontFamily: "var(--font-syne), system-ui, sans-serif",
          }}
        >
          Leaderboard
        </button>
      </div>

      {/* Main Content */}
      <main style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
        {/* ─── BOOKING TAB ─── */}
        {tab === "booking" && (
          <div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#9b9892", marginBottom: "10px" }}>
              SMART PACKAGE SCHEDULER
            </div>
            <h1 style={{ fontSize: "32px", fontWeight: 700, color: "#0a1628", marginBottom: "30px" }}>
              Schedule a <em style={{ fontStyle: "italic", color: "#e8441a" }}>pickup.</em>
            </h1>

            {error && (
              <div
                style={{
                  backgroundColor: "#ffefef",
                  border: "2px solid #e8441a",
                  color: "#e8441a",
                  padding: "16px",
                  borderRadius: "4px",
                  marginBottom: "20px",
                  fontSize: "14px",
                }}
              >
                {error}
              </div>
            )}

            {/* Agent pending confirmation bar */}
            {pendingPickup && !agentConfirmed && (
              <div
                style={{
                  backgroundColor: "#0a1628",
                  border: "2px solid #18b368",
                  borderRadius: "4px",
                  padding: "16px 20px",
                  marginBottom: "30px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#ffffff" }}>
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "#18b368",
                      animation: "pulse 2s infinite",
                    }}
                  />
                  <span style={{ fontSize: "14px" }}>Agent is reviewing your pickup</span>
                  <span
                    style={{
                      marginLeft: "12px",
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontSize: "12px",
                      color: "#9b9892",
                    }}
                  >
                    ID: {pendingPickup.id}
                  </span>
                </div>
                <button
                  onClick={handleAgentConfirm}
                  disabled={loading}
                  style={{
                    backgroundColor: "#18b368",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "8px 20px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1,
                    fontFamily: "var(--font-syne), system-ui, sans-serif",
                  }}
                >
                  {loading ? "Confirming..." : "Confirm Pickup ✓"}
                </button>
              </div>
            )}

            {/* Booking Form */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "30px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#0a1628",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                  }}
                >
                  Sender Name
                </label>
                <input
                  type="text"
                  placeholder="Full name"
                  value={form.sender}
                  onChange={(e) => setForm((f) => ({ ...f, sender: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "#ffffff",
                    border: "2px solid #0a1628",
                    borderRadius: "4px",
                    fontSize: "14px",
                    color: "#0a1628",
                    fontFamily: "var(--font-syne), system-ui, sans-serif",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#0a1628",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                  }}
                >
                  Pickup Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "#ffffff",
                    border: "2px solid #0a1628",
                    borderRadius: "4px",
                    fontSize: "14px",
                    color: "#0a1628",
                    fontFamily: "var(--font-syne), system-ui, sans-serif",
                  }}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#0a1628",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                  }}
                >
                  Pickup Address
                </label>
                <input
                  type="text"
                  placeholder="Street, City, ZIP"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "#ffffff",
                    border: "2px solid #0a1628",
                    borderRadius: "4px",
                    fontSize: "14px",
                    color: "#0a1628",
                    fontFamily: "var(--font-syne), system-ui, sans-serif",
                  }}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#0a1628",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                  }}
                >
                  Notes (optional)
                </label>
                <input
                  type="text"
                  placeholder="Package size, access instructions…"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "#ffffff",
                    border: "2px solid #0a1628",
                    borderRadius: "4px",
                    fontSize: "14px",
                    color: "#0a1628",
                    fontFamily: "var(--font-syne), system-ui, sans-serif",
                  }}
                />
              </div>
            </div>

            {/* Time Slots */}
            <div style={{ marginBottom: "30px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#0a1628",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                }}
              >
                Select Time Slot
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "10px" }}>
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => {
                      if (!UNAVAILABLE_SLOTS.includes(slot)) {
                        setSelectedTime(slot);
                      }
                    }}
                    disabled={UNAVAILABLE_SLOTS.includes(slot)}
                    style={{
                      padding: "12px",
                      backgroundColor:
                        selectedTime === slot ? "#0a1628" : "#ffffff",
                      color: selectedTime === slot ? "#e8441a" : "#0a1628",
                      border: "2px solid #0a1628",
                      borderRadius: "4px",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: UNAVAILABLE_SLOTS.includes(slot) ? "not-allowed" : "pointer",
                      opacity: UNAVAILABLE_SLOTS.includes(slot) ? 0.5 : 1,
                      fontFamily: "var(--font-syne), system-ui, sans-serif",
                    }}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleBook}
              disabled={!ready || loading}
              style={{
                width: "100%",
                padding: "16px",
                backgroundColor: "#e8441a",
                color: "#ffffff",
                border: "none",
                borderRadius: "4px",
                fontSize: "16px",
                fontWeight: 700,
                cursor: !ready || loading ? "not-allowed" : "pointer",
                opacity: !ready || loading ? 0.6 : 1,
                fontFamily: "var(--font-syne), system-ui, sans-serif",
              }}
            >
              {loading ? "⟳ Broadcasting…" : "⬡ Schedule Pickup"}
            </button>

            {/* Confirmation Card */}
            {confirmed && (
              <div
                style={{
                  marginTop: "30px",
                  backgroundColor: "#ffffff",
                  border: "2px solid #18b368",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#18b368",
                    color: "#ffffff",
                    padding: "16px 20px",
                    fontSize: "14px",
                    fontWeight: 700,
                  }}
                >
                  ✓ Pickup Scheduled On-Chain
                </div>
                <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#9b9892",
                        marginBottom: "4px",
                        textTransform: "uppercase",
                      }}
                    >
                      Pickup ID
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontFamily: "var(--font-dm-mono), monospace",
                        color: "#0a1628",
                      }}
                    >
                      {confirmed.id}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#9b9892",
                        marginBottom: "4px",
                        textTransform: "uppercase",
                      }}
                    >
                      Scheduled For
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontFamily: "var(--font-dm-mono), monospace",
                        color: "#0a1628",
                      }}
                    >
                      {formatLocalDateTime(confirmed.scheduledAt)}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#9b9892",
                        marginBottom: "4px",
                        textTransform: "uppercase",
                      }}
                    >
                      Status
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontFamily: "var(--font-dm-mono), monospace",
                        color: agentConfirmed ? "#18b368" : "#e8441a",
                      }}
                    >
                      {confirmed.status}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#9b9892",
                        marginBottom: "4px",
                        textTransform: "uppercase",
                      }}
                    >
                      Booked At
                    </div>
                    <div style={{ fontSize: "12px" }}>
                      <div
                        style={{
                          fontFamily: "var(--font-dm-mono), monospace",
                          color: "#0a1628",
                        }}
                      >
                        {formatLocalDateTime(confirmed.createdAt)}
                      </div>
                      <div
                        style={{
                          color: "#9b9892",
                          fontSize: "11px",
                          marginTop: "2px",
                        }}
                      >
                        ({timeAgo(confirmed.createdAt)})
                      </div>
                    </div>
                  </div>
                  {agentConfirmed && (
                    <div>
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#9b9892",
                          marginBottom: "4px",
                          textTransform: "uppercase",
                        }}
                      >
                        Confirmed At
                      </div>
                      <div style={{ fontSize: "12px" }}>
                        <div
                          style={{
                            fontFamily: "var(--font-dm-mono), monospace",
                            color: "#0a1628",
                          }}
                        >
                          {formatLocalDateTime(confirmed.updatedAt)}
                        </div>
                        <div
                          style={{
                            color: "#9b9892",
                            fontSize: "11px",
                            marginTop: "2px",
                          }}
                        >
                          ({timeAgo(confirmed.updatedAt)})
                        </div>
                      </div>
                    </div>
                  )}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#9b9892",
                        marginBottom: "4px",
                        textTransform: "uppercase",
                      }}
                    >
                      Tx Hash
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontFamily: "var(--font-dm-mono), monospace",
                        color: "#666",
                        wordBreak: "break-all",
                      }}
                    >
                      {confirmed.txHash}
                    </div>
                  </div>
                </div>
                {agentConfirmed && confirmed.tokensMinted && (
                  <div
                    style={{
                      backgroundColor: "#f5f3ee",
                      borderTop: "1px solid #e0e0e0",
                      padding: "16px 20px",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#e8441a",
                    }}
                  >
                    ⬡ +{confirmed.tokensMinted} PKU tokens minted · {formatLocalDateTime(confirmed.updatedAt)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── LEADERBOARD TAB ─── */}
        {tab === "leaderboard" && (
          <div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#9b9892", marginBottom: "10px" }}>
              REWARD RANKINGS
            </div>
            <h1 style={{ fontSize: "32px", fontWeight: 700, color: "#0a1628", marginBottom: "30px" }}>
              Top <em style={{ fontStyle: "italic", color: "#e8441a" }}>earners.</em>
            </h1>

            {/* Stats Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "2px solid #0a1628",
                  borderRadius: "4px",
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "28px", fontWeight: 700, color: "#0a1628", marginBottom: "8px" }}>
                  {currentStats.maxSupply.toLocaleString()}
                </div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#9b9892", textTransform: "uppercase" }}>
                  Max PKU Supply
                </div>
              </div>
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "2px solid #e8441a",
                  borderRadius: "4px",
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "28px", fontWeight: 700, color: "#e8441a", marginBottom: "8px" }}>
                  {currentStats.totalPickups.toLocaleString()}
                </div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#9b9892", textTransform: "uppercase" }}>
                  Total Pickups
                </div>
              </div>
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "2px solid #1a6ee8",
                  borderRadius: "4px",
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "28px", fontWeight: 700, color: "#1a6ee8", marginBottom: "8px" }}>
                  {currentStats.totalTokensMinted.toLocaleString()}
                </div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#9b9892", textTransform: "uppercase" }}>
                  PKU Tokens Minted
                </div>
              </div>
            </div>

            {/* Leaderboard Table */}
            <div style={{ marginBottom: "30px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 1fr 100px 150px 200px",
                  gap: "20px",
                  padding: "12px 0",
                  borderBottom: "2px solid #0a1628",
                  fontWeight: 600,
                  fontSize: "12px",
                  color: "#0a1628",
                  textTransform: "uppercase",
                  marginBottom: "12px",
                }}
              >
                <div>Rank</div>
                <div>Wallet</div>
                <div style={{ textAlign: "right" }}>Pickups</div>
                <div style={{ textAlign: "right" }}>PKU Tokens</div>
                <div style={{ textAlign: "right" }}>Last Pickup</div>
              </div>

              {leaderboard.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#9b9892" }}>
                  No leaderboard entries yet. Start by scheduling your first pickup!
                </div>
              ) : (
                leaderboard.map((row) => (
                  <div
                    key={row.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "60px 1fr 100px 150px 200px",
                      gap: "20px",
                      padding: "12px 0",
                      borderLeft:
                        row.rank === 1
                          ? "4px solid #ffd700"
                          : row.rank === 2
                            ? "4px solid #c0c0c0"
                            : row.rank === 3
                              ? "4px solid #cd7f32"
                              : "4px solid transparent",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontSize: "20px" }}>
                      {["🥇", "🥈", "🥉"][Math.min(row.rank - 1, 2)] || "⬡"}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontFamily: "var(--font-dm-mono), monospace",
                        color: "#0a1628",
                      }}
                    >
                      {row.address}
                    </div>
                    <div style={{ textAlign: "right", fontSize: "14px", fontWeight: 600, color: "#0a1628" }}>
                      {row.pickups}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#1a6ee8" }}>
                        {row.tokens.toLocaleString()}
                      </span>
                      <span style={{ fontSize: "11px", marginLeft: "4px", color: "#9b9892" }}>PKU</span>
                    </div>
                    <div style={{ textAlign: "right", fontSize: "12px" }}>
                      <div
                        style={{
                          fontFamily: "var(--font-dm-mono), monospace",
                          color: "#0a1628",
                          fontWeight: 500,
                        }}
                      >
                        {formatLeaderboardDate(row.lastPickupAt)} · {formatLeaderboardTime(row.lastPickupAt)}
                      </div>
                      <div style={{ color: "#9b9892", fontSize: "11px", marginTop: "2px" }}>
                        {timeAgo(row.lastPickupAt)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <hr
              style={{
                border: "none",
                borderTop: "1px solid #e0e0e0",
                margin: "20px 0",
              }}
            />

            <div style={{ textAlign: "center", color: "#9b9892", fontSize: "12px", fontFamily: "var(--font-dm-mono), monospace" }}>
              100 PKU tokens minted per confirmed pickup · ERC-20 on-chain · MAX_SUPPLY 1,000,000
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
