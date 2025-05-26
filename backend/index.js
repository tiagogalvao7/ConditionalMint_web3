require("dotenv").config({ path: __dirname + "/.env" }); // <- GARANTE carregamento do .env antes de tudo
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

// DEBUG: verificar se as variáveis foram carregadas corretamente
console.log(
  "🔐 PINATA_API_KEY:",
  process.env.PINATA_API_KEY ? "carregado" : "NÃO DEFINIDO"
);
console.log(
  "🔐 PINATA_API_SECRET:",
  process.env.PINATA_API_SECRET ? "carregado" : "NÃO DEFINIDO"
);
console.log(
  "🔑 PRIVATE_KEY:",
  process.env.PRIVATE_KEY ? "carregado" : "NÃO DEFINIDO"
);
console.log("🌐 RPC_URL:", process.env.RPC_URL || "NÃO DEFINIDO");

// Verifica se os dados mínimos estão presentes
if (
  !process.env.PRIVATE_KEY ||
  !process.env.RPC_URL ||
  !process.env.PINATA_API_KEY ||
  !process.env.PINATA_API_SECRET
) {
  console.error("❌ Variáveis de ambiente ausentes. Verifique seu .env");
  process.exit(1);
}

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
