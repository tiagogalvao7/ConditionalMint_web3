# Web3 NFT Conditional Mint Platform

Full-stack dApp for conditional NFT minting using React, Node.js, and Solidity on Base Testnet.

---

## Tech Stack

- **Frontend:** React + ethers.js
- **Backend:** Node.js + ethers.js
- **Smart Contract:** Solidity (Hardhat)
- **Blockchain:** Base Testnet
- **Storage:** IPFS via Pinata

---

## Project Structure

- `frontend/` — React app for user interaction
- `backend/` — Node.js server listening to contract events and handling mint/refund logic
- `smart-contract/` — Solidity contracts and Hardhat scripts for deployment and testing

---

## How to Run Locally

### Backend

```bash
cd backend
npm install
node index.js
```

## Hardhat Usage

This project includes a basic Hardhat setup with a sample contract, tests, and deployment scripts.

### Useful commands:

- `npx hardhat help` — show Hardhat commands
- `npx hardhat test` — run contract tests
- `REPORT_GAS=true npx hardhat test` — run tests with gas report
- `npx hardhat node` — start local Hardhat node
- `npx hardhat ignition deploy ./ignition/modules/Lock.js` — deploy contract using Hardhat Ignition

### Notes

- Set up the required environment variables for backend and Hardhat (e.g., API keys, `RPC_URL`, `PRIVATE_KEY`).
- In frontend, configure the backend URL using the `BASE_URL` variable.
