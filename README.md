# PKU·CHAIN — Smart Package Pickup Scheduler

A blockchain-powered delivery scheduling dApp where agents earn PKU tokens for every confirmed pickup.

---

## What the App Does

PKU·CHAIN is a full-stack Web3 application that allows customers to schedule package pickups, have them confirmed by agents, and automatically earn ERC-20 reward tokens for every successful delivery interaction.

The app combines a Next.js frontend, a PostgreSQL database managed by Prisma, and a Solidity smart contract deployed on-chain.

---

## How It Works

### 1. Customer Books a Pickup
The customer fills out the booking form on the dashboard with their name, pickup address, date, time slot, and any notes. When they submit, the app sends the booking to the backend which finds an available agent and creates a pickup record in the database with a status of `PENDING`.

### 2. Agent Reviews and Confirms
Once a pickup is scheduled, the agent sees it in real time on the dashboard. The agent clicks "Confirm Pickup" which triggers a confirmation request to the backend. The backend updates the pickup status to `CONFIRMED`, records the exact confirmation timestamp, and kicks off the token minting process.

### 3. Token Minting
After confirmation, the backend automatically creates a `PickupToken` record in the database representing 100 PKU tokens minted to the customer's wallet. This mirrors the on-chain `mint(address to, uint256 amount)` function in the `PickupToken.sol` ERC-20 smart contract. Each confirmed pickup mints exactly 100 PKU tokens. The total supply is capped at 1,000,000 PKU.

### 4. Leaderboard Updates
After every confirmed pickup, the customer's `LeaderboardEntry` is automatically updated — their total pickups and total PKU tokens increase, and their `lastPickupAt` timestamp refreshes. The leaderboard ranks all customers by total pickups and displays their wallet address, pickup count, token balance, and the date and time of their last pickup.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router, TypeScript |
| Styling | Tailwind CSS, custom CSS |
| Database | PostgreSQL |
| ORM | Prisma |
| Blockchain | Solidity, Foundry |
| Token Standard | ERC-20 (OpenZeppelin) |
| Wallet | MetaMask (ethers.js) |

---

## Smart Contract

The `PickupToken.sol` contract is an ERC-20 token with the following properties:

- **Name:** PickupToken
- **Symbol:** PKU
- **Max Supply:** 1,000,000 PKU
- **Mint Amount:** 100 PKU per confirmed pickup
- **Access Control:** Only the contract owner (admin) can mint tokens
- **Extensions:** ERC20Burnable, ERC20Pausable, Ownable

---

## Database Models

- **User** — customers and agents with wallet addresses and roles
- **Pickup** — each scheduled pickup with status, location, time, and agent assignment
- **PickupToken** — one record per confirmed pickup representing the minted tokens
- **LeaderboardEntry** — one record per customer tracking their total pickups, tokens, and last activity

---

## Pickup Lifecycle
```
Customer submits form
        ↓
Pickup created (PENDING)
        ↓
Agent confirms pickup
        ↓
Status → CONFIRMED
        ↓
100 PKU tokens minted
        ↓
Leaderboard updated
```

---

## API Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/users/pickup` | Schedule a new pickup |
| PATCH | `/api/pickups/[id]/confirm` | Agent confirms a pickup and triggers token mint |
| GET | `/api/leaderboard` | Fetch ranked leaderboard entries and stats |

---

## Getting Started
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local .env
# Add your DATABASE_URL to both files

# Run database migrations
npx prisma migrate dev
npx prisma generate

# Start PostgreSQL
sudo service postgresql start

# Start the development server
npm run dev
```

Open `http://localhost:3000` for the landing page and `http://localhost:3000/dashboard` for the booking and leaderboard.

---

## Team Collaboration

| Role | Responsibility |
|---|---|
| FE | Booking form and leaderboard UI |
| BE | Scheduling engine and API routes |
| BC | PKU token smart contract and minting logic |
| QA | Conflict and abuse tests |
| PM | Pickup lifecycle diagram |

---
