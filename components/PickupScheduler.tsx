"use client";

import { useState, useEffect } from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface LeaderboardRow {
  rank: number;
  id: string;
  address: string;
  pickups: number;
  tokens: number;
  lastPickupAt: string;
}

interface Stats {
  totalPickups: number;
  totalTokensMinted: number;
  maxSupply: number;
}

interface ConfirmedPickup {
  id: string;
  senderName: string;
  address: string;       // remapped from location
  scheduledAt: string;   // remapped from pickupTime
  createdAt: string;
  updatedAt: string;
  status: string;
  txHash: string | null;
  tokensMinted: number | null;
}

export interface PickupSchedulerProps {
  initialLeaderboard: LeaderboardRow[];
  stats: Stats;
}

// ─── TIMESTAMP HELPERS ────────────────────────────────────────────────────────

function formatLeaderboardDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function formatLeaderboardTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  let h = d.getHours();
  const min = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${min} ${ampm}`;
}

function formatLocalDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 10)    return "just now";
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function buildScheduledAtISO(dateStr: string, timeSlot: string): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi]    = timeSlot.split(":").map(Number);
  return new Date(y, mo - 1, d, h, mi, 0, 0).toISOString();
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const MOCK_AGENT   = { name: "Agent #0x4f2A", wallet: "0x4f2A...c9E1" };
const TIME_SLOTS   = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
const UNAVAILABLE  = ["10:00", "15:00"];
const BADGES       = ["🥇","🥈","🥉","⬡","⬡","⬡","⬡","⬡","⬡","⬡"];
const DEMO_USER_ID = "demo-user-uuid"; // replace with real session userId

// ─── STYLES ───────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

  :root {
    --navy: #0a1628;
    --accent: #e8441a;
    --accent2: #1a6ee8;
    --muted: #9b9892;
    --success: #18b368;
    --card: #ffffff;
    --paper: #f5f3ee;
    --border: #0a1628;
  }

  .pku-wrap {
    font-family: 'Syne', sans-serif;
    background: var(--card);
    color: var(--navy);
    min-height: 100vh;
  }
  .mono { font-family: 'DM Mono', monospace; }

  /* Header */
  .pku-header {
    background: var(--navy);
    padding: 18px 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 3px solid var(--accent);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .pku-logo { font-size: 18px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
  .pku-logo span { color: var(--accent); }
  .pku-agent-hd { display: flex; align-items: center; gap: 10px; color: var(--muted); font-size: 13px; }
  .pku-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--success); animation: pkuPulse 2s infinite;
  }
  @keyframes pkuPulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
  .pku-wallet {
    background: #000; border: 1px solid #333; color: #fff;
    padding: 6px 14px; border-radius: 4px;
    font-family: 'DM Mono', monospace; font-size: 12px;
  }

  /* Tabs */
  .pku-tabs {
    display: flex; background: var(--navy);
    padding: 0 40px; border-bottom: 2px solid var(--navy);
  }
  .pku-tab {
    padding: 14px 28px; font-size: 13px; font-weight: 600;
    letter-spacing: 1px; text-transform: uppercase;
    color: var(--muted); cursor: pointer;
    border-bottom: 3px solid transparent;
    margin-bottom: -2px; background: none;
    border-top: none; border-left: none; border-right: none;
    transition: all 0.2s;
  }
  .pku-tab:hover { color: #fff; }
  .pku-tab.active { color: var(--accent); border-bottom-color: var(--accent); }

  /* Main */
  .pku-main { max-width: 1100px; margin: 0 auto; padding: 40px 24px; }
  .pku-sublabel {
    font-size: 11px; font-weight: 600; letter-spacing: 3px;
    text-transform: uppercase; color: var(--muted); margin-bottom: 8px;
  }
  .pku-title {
    font-size: 36px; font-weight: 800; line-height: 1;
    margin-bottom: 32px; letter-spacing: -1px;
  }
  .pku-title em { font-style: normal; color: var(--accent); }

  /* Form */
  .pku-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
  .pku-field { display: flex; flex-direction: column; gap: 8px; }
  .pku-flabel {
    font-size: 11px; font-weight: 700; letter-spacing: 2px;
    text-transform: uppercase; color: var(--navy);
  }
  .pku-input {
    border: 2px solid var(--navy); background: #fff;
    padding: 12px 16px; font-family: 'Syne', sans-serif;
    font-size: 15px; color: var(--navy); outline: none;
    transition: border-color 0.2s; border-radius: 4px; width: 100%;
  }
  .pku-input:focus { border-color: var(--accent); }
  .pku-input::placeholder { color: var(--muted); }

  /* Time slots */
  .pku-slots { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 24px; }
  .pku-slot {
    padding: 10px 18px; border: 2px solid var(--navy);
    background: #fff; font-family: 'DM Mono', monospace;
    font-size: 14px; cursor: pointer; transition: all 0.15s; border-radius: 4px;
  }
  .pku-slot:hover { border-color: var(--accent); color: var(--accent); }
  .pku-slot.sel { background: var(--navy); color: var(--accent); border-color: var(--navy); }
  .pku-slot.off { opacity: 0.3; cursor: not-allowed; text-decoration: line-through; }

  /* Button */
  .pku-btn {
    background: var(--accent); color: white; border: none;
    padding: 16px 36px; font-family: 'Syne', sans-serif;
    font-size: 15px; font-weight: 700; letter-spacing: 1px;
    text-transform: uppercase; cursor: pointer; transition: all 0.2s;
    border-radius: 4px; display: inline-flex; align-items: center; gap: 10px;
  }
  .pku-btn:hover { background: #c93a16; transform: translateY(-1px); }
  .pku-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  /* Agent bar */
  .pku-agent-bar {
    background: var(--navy); border: 1px solid #1a2a4a;
    padding: 16px 24px; display: flex; align-items: center;
    justify-content: space-between; margin-bottom: 32px; border-radius: 4px;
  }
  .pku-agent-info { display: flex; align-items: center; gap: 12px; color: #fff; font-size: 14px; }
  .pku-confirm-btn {
    background: var(--success); color: white; border: none;
    padding: 8px 20px; font-family: 'Syne', sans-serif;
    font-size: 12px; font-weight: 700; letter-spacing: 1px;
    text-transform: uppercase; cursor: pointer; border-radius: 4px;
    transition: background 0.2s;
  }
  .pku-confirm-btn:hover { background: #139f58; }

  /* Confirmation card */
  .pku-card {
    border: 2px solid var(--success); background: #f0faf5;
    padding: 28px 32px; margin-top: 32px; border-radius: 4px;
    animation: pkuSlide 0.3s ease;
  }
  @keyframes pkuSlide { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }
  .pku-card-title { font-size: 20px; font-weight: 800; color: var(--success); margin-bottom: 16px; }
  .pku-card-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 20px; }
  .pku-ci-label {
    font-size: 10px; font-weight: 700; letter-spacing: 2px;
    text-transform: uppercase; color: var(--muted); margin-bottom: 4px;
  }
  .pku-ci-val { font-family: 'DM Mono', monospace; font-size: 15px; font-weight: 500; color: var(--navy); }
  .pku-mint {
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--navy); color: var(--accent);
    padding: 8px 18px; font-family: 'DM Mono', monospace;
    font-size: 13px; border-radius: 4px;
  }

  /* Stats */
  .pku-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 32px; }
  .pku-stat {
    background: #fff; border: 2px solid var(--navy);
    padding: 20px 24px; border-radius: 4px;
  }
  .pku-stat-val { font-size: 32px; font-weight: 800; letter-spacing: -1px; color: var(--navy); }
  .pku-stat-val.a1 { color: var(--accent); }
  .pku-stat-val.a2 { color: var(--accent2); }
  .pku-stat-label {
    font-size: 10px; font-weight: 700; letter-spacing: 2px;
    text-transform: uppercase; color: var(--muted); margin-top: 4px;
  }

  /* Leaderboard */
  .pku-lb-head {
    display: grid; gap: 16px; padding: 10px 20px;
    grid-template-columns: 60px 1fr 90px 130px 160px;
    font-size: 10px; font-weight: 700; letter-spacing: 2px;
    text-transform: uppercase; color: var(--muted);
    border-bottom: 2px solid var(--navy); margin-bottom: 8px;
  }
  .pku-lb-row {
    display: grid; gap: 16px; padding: 16px 20px;
    grid-template-columns: 60px 1fr 90px 130px 160px;
    align-items: center; border: 1px solid transparent;
    transition: all 0.15s; border-radius: 4px;
  }
  .pku-lb-row:hover { background: #f8f8f8; border-color: var(--navy); }
  .pku-lb-row.r1 { background: #fff; border-color: #e0ddd8; border-left: 4px solid gold; }
  .pku-lb-row.r2 { background: #fff; border-color: #e0ddd8; border-left: 4px solid silver; }
  .pku-lb-row.r3 { background: #fff; border-color: #e0ddd8; border-left: 4px solid #cd7f32; }
  .pku-lb-rank { font-size: 22px; text-align: center; }
  .pku-lb-addr { font-family: 'DM Mono', monospace; font-size: 14px; color: var(--navy); }
  .pku-lb-num  { font-family: 'DM Mono', monospace; font-size: 15px; font-weight: 500; text-align: right; }
  .pku-lb-tok  { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
  .pku-lb-tokval { font-family: 'DM Mono', monospace; font-size: 15px; color: var(--accent2); font-weight: 500; }
  .pku-lb-tag  { font-size: 10px; font-weight: 700; letter-spacing: 1px; color: var(--muted); }
  .pku-divider { border: none; border-top: 1px solid #ddd; margin: 40px 0; }
  .pku-footer  { text-align: center; color: var(--muted); font-size: 12px; font-family: 'DM Mono', monospace; }

  @keyframes pkuSpin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
`;

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function PickupScheduler({ initialLeaderboard, stats }: PickupSchedulerProps) {
  const [tab, setTab]           = useState<"booking" | "leaderboard">("booking");
  const [form, setForm]         = useState({ sender: "", address: "", date: "", notes: "" });
  const [selectedTime, setTime] = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [confirmed, setConfirmed]     = useState<ConfirmedPickup | null>(null);
  const [agentConfirmed, setAgentDone] = useState(false);
  const [pendingPickup, setPending]    = useState<ConfirmedPickup | null>(null);
  const [leaderboard, setLeaderboard]  = useState<LeaderboardRow[]>(initialLeaderboard);
  const [liveStats, setLiveStats]      = useState<Stats>(stats);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // ── Book pickup ─────────────────────────────────────────────────────────────
  // POST to /api/users/pickup (your existing route)
  // Sends field names the API route expects after our fix
  const handleBook = async () => {
    if (!form.sender || !form.address || !form.date || !selectedTime) return;
    setLoading(true);
    try {
      const res = await fetch("/api/users/pickup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId:      DEMO_USER_ID,          // → customerId in Prisma
          senderName:  form.sender,
          address:     form.address,          // → location in Prisma
          notes:       form.notes || null,
          scheduledAt: buildScheduledAtISO(form.date, selectedTime), // → pickupTime in Prisma
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      // Response is remapped by the API: location→address, pickupTime→scheduledAt
      const pickup: ConfirmedPickup = await res.json();
      setConfirmed(pickup);
      setPending(pickup);
    } catch (err) {
      console.error("Booking failed:", err);
      alert("Failed to schedule pickup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Agent confirm ────────────────────────────────────────────────────────────
  // PATCH /api/pickups/[id]/confirm
  const handleAgentConfirm = async () => {
    if (!pendingPickup) return;
    try {
      const res = await fetch(`/api/pickups/${pendingPickup.id}/confirm`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error(await res.text());
      const { pickup } = await res.json();

      setConfirmed({ ...pickup, tokensMinted: 100 });
      setAgentDone(true);
      setPending(null);

      // Refresh leaderboard from GET /api/leaderboard
      const lb = await fetch("/api/leaderboard");
      const lbData = await lb.json();
      setLeaderboard(
        lbData.entries.map((e: any, i: number) => ({
          rank:        i + 1,
          id:          e.id,
          address:     e.walletDisplay,
          pickups:     e.totalPickups,
          tokens:      e.totalTokens,
          lastPickupAt: e.lastPickupAt,
        }))
      );
      setLiveStats(lbData.stats);
    } catch (err) {
      console.error("Confirm failed:", err);
      alert("Agent confirmation failed. Please try again.");
    }
  };

  const ready = form.sender && form.address && form.date && selectedTime;

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="pku-wrap">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* Header */}
      <header className="pku-header">
        <div className="pku-logo">PKU<span>•</span>CHAIN</div>
        <div className="pku-agent-hd">
          <div className="pku-dot" />
          <span className="mono">{MOCK_AGENT.name}</span>
          <div className="pku-wallet">{MOCK_AGENT.wallet}</div>
        </div>
      </header>

      {/* Tabs */}
      <div className="pku-tabs">
        <button
          className={`pku-tab ${tab === "booking" ? "active" : ""}`}
          onClick={() => setTab("booking")}
        >
          Book Pickup
        </button>
        <button
          className={`pku-tab ${tab === "leaderboard" ? "active" : ""}`}
          onClick={() => setTab("leaderboard")}
        >
          Leaderboard
        </button>
      </div>

      <main className="pku-main">

        {/* ── BOOKING TAB ── */}
        {tab === "booking" && (
          <>
            <div className="pku-sublabel">Smart Package Scheduler</div>
            <h1 className="pku-title">Schedule a <em>pickup.</em></h1>

            {/* Agent bar — shown after booking, before confirmation */}
            {pendingPickup && !agentConfirmed && (
              <div className="pku-agent-bar">
                <div className="pku-agent-info">
                  <div className="pku-dot" />
                  <span>{MOCK_AGENT.name} is reviewing your pickup</span>
                  <span className="mono" style={{ color: "var(--muted)", fontSize: 12 }}>
                    ID: {pendingPickup.id.slice(0, 8)}…
                  </span>
                </div>
                <button className="pku-confirm-btn" onClick={handleAgentConfirm}>
                  Confirm Pickup ✓
                </button>
              </div>
            )}

            {/* Form */}
            <div className="pku-grid">
              <div className="pku-field">
                <label className="pku-flabel">Sender Name</label>
                <input
                  className="pku-input"
                  placeholder="Full name"
                  value={form.sender}
                  onChange={e => setForm(f => ({ ...f, sender: e.target.value }))}
                />
              </div>
              <div className="pku-field">
                <label className="pku-flabel">Pickup Date</label>
                <input
                  className="pku-input"
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="pku-field" style={{ gridColumn: "1 / -1" }}>
                <label className="pku-flabel">Pickup Address</label>
                <input
                  className="pku-input"
                  placeholder="Street, City, ZIP"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div className="pku-field" style={{ gridColumn: "1 / -1" }}>
                <label className="pku-flabel">Notes (optional)</label>
                <input
                  className="pku-input"
                  placeholder="Package size, access instructions…"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>

            {/* Time slots */}
            <div className="pku-flabel" style={{ marginBottom: 12 }}>Select Time Slot</div>
            <div className="pku-slots">
              {TIME_SLOTS.map(t => (
                <button
                  key={t}
                  className={`pku-slot ${selectedTime === t ? "sel" : ""} ${UNAVAILABLE.includes(t) ? "off" : ""}`}
                  onClick={() => !UNAVAILABLE.includes(t) && setTime(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            <button className="pku-btn" onClick={handleBook} disabled={!ready || loading}>
              {loading ? (
                <>
                  <span style={{ display: "inline-block", animation: "pkuSpin 1s linear infinite" }}>⟳</span>
                  Broadcasting…
                </>
              ) : (
                <>⬡ Schedule Pickup</>
              )}
            </button>

            {/* Confirmation card */}
            {confirmed && (
              <div className="pku-card">
                <div className="pku-card-title">✓ Pickup Scheduled On-Chain</div>
                <div className="pku-card-grid">
                  <div>
                    <div className="pku-ci-label">Pickup ID</div>
                    {/* id from Prisma Pickup.id (uuid) */}
                    <div className="pku-ci-val mono">{confirmed.id.slice(0, 13)}…</div>
                  </div>
                  <div>
                    <div className="pku-ci-label">Scheduled For</div>
                    {/* scheduledAt ← pickupTime from Prisma, remapped in API response */}
                    <div className="pku-ci-val mono">{formatLocalDateTime(confirmed.scheduledAt)}</div>
                  </div>
                  <div>
                    <div className="pku-ci-label">Status</div>
                    {/* status from Prisma PickupStatus enum */}
                    <div
                      className="pku-ci-val mono"
                      style={{ color: agentConfirmed ? "#18b368" : "#e8441a" }}
                    >
                      {confirmed.status}
                    </div>
                  </div>
                  <div>
                    <div className="pku-ci-label">Booked At</div>
                    {/* createdAt from Prisma @default(now()) */}
                    <div className="pku-ci-val mono" style={{ fontSize: 13 }}>
                      {formatLocalDateTime(confirmed.createdAt)}
                      <span style={{ color: "var(--muted)", marginLeft: 6 }}>
                        ({timeAgo(confirmed.createdAt)})
                      </span>
                    </div>
                  </div>
                  {agentConfirmed && (
                    <div>
                      <div className="pku-ci-label">Confirmed At</div>
                      {/* updatedAt from Prisma @updatedAt — set when PATCH confirm runs */}
                      <div className="pku-ci-val mono" style={{ fontSize: 13 }}>
                        {formatLocalDateTime(confirmed.updatedAt)}
                        <span style={{ color: "var(--muted)", marginLeft: 6 }}>
                          ({timeAgo(confirmed.updatedAt)})
                        </span>
                      </div>
                    </div>
                  )}
                  {confirmed.txHash && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div className="pku-ci-label">Tx Hash</div>
                      <div className="pku-ci-val mono" style={{ fontSize: 12, color: "#666", wordBreak: "break-all" }}>
                        {confirmed.txHash}
                      </div>
                    </div>
                  )}
                </div>
                {agentConfirmed && confirmed.tokensMinted && (
                  <div className="pku-mint">
                    ⬡ +{confirmed.tokensMinted} PKU tokens minted · {formatLocalDateTime(confirmed.updatedAt)}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── LEADERBOARD TAB ── */}
        {tab === "leaderboard" && (
          <>
            <div className="pku-sublabel">Reward Rankings</div>
            <h1 className="pku-title">Top <em>earners.</em></h1>

            {/* Stats bar — values from GET /api/leaderboard → stats */}
            <div className="pku-stats">
              <div className="pku-stat">
                <div className="pku-stat-val">{liveStats.maxSupply.toLocaleString()}</div>
                <div className="pku-stat-label">Max PKU Supply</div>
              </div>
              <div className="pku-stat">
                <div className="pku-stat-val a1">{liveStats.totalPickups.toLocaleString()}</div>
                <div className="pku-stat-label">Total Pickups</div>
              </div>
              <div className="pku-stat">
                <div className="pku-stat-val a2">{liveStats.totalTokensMinted.toLocaleString()}</div>
                <div className="pku-stat-label">PKU Tokens Minted</div>
              </div>
            </div>

            {/* Table header */}
            <div className="pku-lb-head">
              <div>Rank</div>
              <div>Wallet</div>
              <div style={{ textAlign: "right" }}>Pickups</div>
              <div style={{ textAlign: "right" }}>PKU Tokens</div>
              <div style={{ textAlign: "right" }}>Last Pickup</div>
            </div>

            {leaderboard.length === 0 && (
              <div style={{ padding: "40px 20px", color: "var(--muted)", fontFamily: "DM Mono, monospace", fontSize: 13 }}>
                No confirmed pickups yet — be the first!
              </div>
            )}

            {leaderboard.map((row, i) => (
              <div
                key={row.id}
                className={`pku-lb-row ${row.rank === 1 ? "r1" : row.rank === 2 ? "r2" : row.rank === 3 ? "r3" : ""}`}
              >
                <div className="pku-lb-rank">{BADGES[i] ?? "⬡"}</div>
                <div className="pku-lb-addr">{row.address}</div>
                <div className="pku-lb-num">{row.pickups}</div>
                <div className="pku-lb-tok">
                  <span className="pku-lb-tokval">{row.tokens.toLocaleString()}</span>
                  <span className="pku-lb-tag">PKU</span>
                </div>
                {/* lastPickupAt = LeaderboardEntry.updatedAt (@updatedAt) */}
                {/* Formatted as DD/MM/YYYY · H:MM AM/PM + timeAgo() below */}
                <div style={{ textAlign: "right", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
                  <div style={{ fontWeight: 500, color: "var(--navy)" }}>
                    {formatLeaderboardDate(row.lastPickupAt)} · {formatLeaderboardTime(row.lastPickupAt)}
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: 11, marginTop: 2 }}>
                    {timeAgo(row.lastPickupAt)}
                  </div>
                </div>
              </div>
            ))}

            <hr className="pku-divider" />
            <div className="pku-footer">
              100 PKU tokens minted per confirmed pickup · ERC-20 on-chain · MAX_SUPPLY 1,000,000
            </div>
          </>
        )}
      </main>
    </div>
  );
}