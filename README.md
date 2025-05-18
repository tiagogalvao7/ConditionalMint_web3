# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```

# Web3 NFT Conditional Mint Platform

Full-stack dApp using React + Node.js + Solidity (Base Testnet)

## Tech Stack

- Frontend: React + ethers.js
- Backend: Node.js + ethers
- Smart Contract: Solidity (Hardhat)
- Blockchain: Base Testnet
- IPFS: Pinata

## Structure

- `frontend/` - React app
- `backend/` - Listens to contract events and mints/refunds
- `smart-contract/` - Solidity code

## Run locally

### Backend

```bash
cd backend
npm install
node index.js
```
