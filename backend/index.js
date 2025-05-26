require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());
app.use(express.json());

const { ethers } = require("ethers");
const contractData = require("./abi.json");
const contractAddress = "0x2310c54F959012f5670A70f30EF67b7Bb883384D";
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const {
  uploadImageToPinata,
  uploadMetadataToPinata,
} = require("./uploadToPinata");

// DEBUG: check if environment variables were loaded correctly
console.log(
  "🔐 PINATA_API_KEY:",
  process.env.PINATA_API_KEY ? "loaded" : "NOT DEFINED"
);
console.log(
  "🔐 PINATA_API_SECRET:",
  process.env.PINATA_API_SECRET ? "loaded" : "NOT DEFINED"
);
console.log(
  "🔑 PRIVATE_KEY:",
  process.env.PRIVATE_KEY ? "loaded" : "NOT DEFINED"
);
console.log("🌐 RPC_URL:", process.env.RPC_URL || "NOT DEFINED");

// Validate required environment variables
if (
  !process.env.PRIVATE_KEY ||
  !process.env.RPC_URL ||
  !process.env.PINATA_API_KEY ||
  !process.env.PINATA_API_SECRET
) {
  console.error("❌ Missing environment variables. Check your .env file.");
  process.exit(1);
}

const privateKey = process.env.PRIVATE_KEY;
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, contractData, wallet);

// 🔔 Listen for contract events
console.log("✅ Listening for PurchaseInitiated events...");

contract.on(
  "PurchaseInitiated",
  async (txHash, buyer, name, imageURI, value) => {
    console.log(
      `📥 New PurchaseInitiated:\n- Hash: ${txHash}\n- Buyer: ${buyer}\n- Name: ${name}\n- Value: ${ethers.formatEther(
        value
      )} ETH`
    );

    const isApproved = Math.random() > 0.5;
    let tokenURI = "ipfs://placeholder-metadata";

    if (isApproved) {
      console.log("✅ Purchase approved. Preparing NFT metadata...");

      try {
        let finalImageURI = imageURI;

        if (!imageURI.startsWith("ipfs://")) {
          console.log("📤 Fetching and uploading image to IPFS via Pinata...");
          const response = await fetch(imageURI);
          const imageBuffer = Buffer.from(await response.arrayBuffer());

          finalImageURI = await uploadImageToPinata(name, imageBuffer);
        }

        console.log("🧾 Uploading metadata to IPFS via Pinata...");
        tokenURI = await uploadMetadataToPinata(name, finalImageURI);

        console.log("🛠 Minting NFT...");
        const mintTx = await contract.safeMint(buyer, tokenURI, txHash);
        await mintTx.wait();
        console.log("🎉 NFT minted successfully!");
      } catch (err) {
        console.error("❌ Error during minting:", err);
      }
    } else {
      console.log("❌ Purchase rejected. Initiating refund...");
      try {
        const refundTx = await contract.refund(buyer, value, txHash);
        await refundTx.wait();
        console.log("💸 Refund completed.");
      } catch (err) {
        console.error("❌ Error processing refund:", err);
      }
    }

    // Log the purchase result
    const logPath = path.join(__dirname, "tx-log.json");
    let log = {};
    if (fs.existsSync(logPath)) {
      log = JSON.parse(fs.readFileSync(logPath));
    }
    log[txHash] = isApproved ? "approved" : "rejected";
    fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
  }
);

// 📨 HTTP endpoint for frontend notification
app.post("/purchase-notification", (req, res) => {
  const { txHash, itemName, imageURI } = req.body;
  console.log("📨 Received frontend notification:");
  console.log("- txHash:", txHash);
  console.log("- itemName:", itemName);
  console.log("- imageURI:", imageURI);

  // You can add logging, metrics, or queueing here if needed
  res.status(200).json({ message: "Notification received by backend." });
});

// New endpoint to return the status of a transaction
app.get("/tx-status/:txHash", (req, res) => {
  const { txHash } = req.params;
  const logPath = path.join(__dirname, "tx-log.json");

  if (!fs.existsSync(logPath)) {
    return res.status(404).json({ error: "No transaction log found" });
  }

  const log = JSON.parse(fs.readFileSync(logPath));
  const status = log[txHash] || "pending";

  res.json({ status });
});

// Start HTTP server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 HTTP server listening on port ${PORT}`);
});
