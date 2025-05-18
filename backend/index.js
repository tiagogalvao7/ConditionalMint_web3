const { ethers } = require("ethers");
const contractData = require("./abi.json");
const contractAddress = "0x2310c54F959012f5670A70f30EF67b7Bb883384D";
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { uploadImageToIPFS, uploadMetadataToIPFS } = require("./uploadToIPFS");

const privateKey = process.env.PRIVATE_KEY;
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(privateKey, provider);

const contract = new ethers.Contract(contractAddress, contractData, wallet);

console.log("✅ Listening for PurchaseInitiated events...");

contract.on(
  "PurchaseInitiated",
  async (txHash, buyer, name, imageURI, value) => {
    console.log(
      `📥 New PurchaseInitiated:\n- Hash: ${txHash}\n- Buyer: ${buyer}\n- Name: ${name}\n- Value: ${ethers.formatEther(
        value
      )} ETH`
    );

    // Simulate approval logic
    const isApproved = Math.random() > 0.5;

    let tokenURI = "ipfs://placeholder-metadata";

    if (isApproved) {
      console.log("✅ Purchase approved. Preparing NFT metadata...");

      try {
        if (!imageURI.startsWith("ipfs://")) {
          console.log("📤 Uploading image to IPFS...");
          const imageIPFS = await uploadImageToIPFS(imageURI);
          console.log("🧾 Uploading metadata to IPFS...");
          tokenURI = await uploadMetadataToIPFS(name, imageIPFS);
        } else {
          tokenURI = await uploadMetadataToIPFS(name, imageURI);
        }

        console.log("🛠 Minting NFT...");
        const mintTx = await contract.safeMint(buyer, tokenURI, txHash);
        await mintTx.wait();
        console.log("🎉 NFT minted successfully!");
      } catch (err) {
        console.error("❌ Error during minting:", err);
      }
    } else {
      console.log("❌ Purchase rejected. Refunding...");
      try {
        const refundTx = await contract.refund(buyer, value, txHash);
        await refundTx.wait();
        console.log("💸 Refund completed.");
      } catch (err) {
        console.error("❌ Error processing refund:", err);
      }
    }

    // Log purchase result
    const logPath = path.join(__dirname, "tx-log.json");
    let log = {};
    if (fs.existsSync(logPath)) {
      log = JSON.parse(fs.readFileSync(logPath));
    }
    log[txHash] = isApproved ? "approved" : "rejected";
    fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
  }
);
