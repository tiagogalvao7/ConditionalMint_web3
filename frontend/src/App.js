import { useState } from "react";
import { ethers } from "ethers";
import ConditionalMintABI from "./abi/ConditionalMint.json";
import "./App.css";

const ITEMS = [
  {
    name: "Cool Cat",
    image:
      "https://gateway.pinata.cloud/ipfs/bafkreiapdg43qxsuadu3ge7cuxwe2xtzvap6luj37hicciesvb5btlwjzy",
    price: "0.001",
  },
  {
    name: "Alien Punk",
    image:
      "https://gateway.pinata.cloud/ipfs/bafkreiemdkzemxpaqxus5ba7ut2f6gcddeqlchum7i6rtl7osq2fxkmrky",
    price: "0.001",
  },
];

const contractAddress = "0x2310c54F959012f5670A70f30EF67b7Bb883384D";

// Choose the base URL depending on the hostname (localhost or production)
const BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3001"
    : "https://conditional-mint-web3.vercel.app";

function App() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [status, setStatus] = useState("");

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Install MetaMask");
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setCurrentAccount(accounts[0]);
      setStatus("Wallet connected.");
    } catch (err) {
      console.error("Wallet connection error:", err);
      setStatus("Wallet connection failed.");
    }
  };

  const purchase = async (item) => {
    try {
      setStatus("🦊 Waiting for MetaMask...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        ConditionalMintABI.abi,
        signer
      );

      const tx = await contract.buyItem(item.name, item.image, {
        value: ethers.parseEther(item.price),
      });
      setStatus("⏳ Transaction sent. Waiting confirmation...");

      await tx.wait();
      setStatus(`✅ Tx confirmed! Hash: ${tx.hash}. Notifying backend...`);

      // Backend notification
      const notifyResponse = await fetch(`${BASE_URL}/purchase-notification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txHash: tx.hash,
          itemName: item.name,
          imageURI: item.image,
        }),
      });

      if (!notifyResponse.ok) {
        throw new Error(
          `Backend error: ${notifyResponse.status} ${notifyResponse.statusText}`
        );
      }

      // Poll backend for final status
      setStatus("⌛ Awaiting backend processing...");

      let finalStatus = "pending";
      const maxRetries = 20;
      let retries = 0;

      while (finalStatus === "pending" && retries < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 3000)); // 3s delay
        const statusRes = await fetch(`${BASE_URL}/tx-status/${tx.hash}`);
        if (!statusRes.ok)
          throw new Error("Failed to fetch transaction status");
        const data = await statusRes.json();
        finalStatus = data.status;
        retries++;
      }

      if (finalStatus === "approved") {
        setStatus("🎉 NFT minted successfully!");
      } else if (finalStatus === "rejected") {
        setStatus("💸 Purchase rejected and refunded.");
      } else {
        setStatus("❌ Backend processing timeout.");
      }
    } catch (err) {
      console.error(err);
      setStatus("❌ Transaction or backend request failed.");
    }
  };

  return (
    <div className="App">
      <h1>NFT Shop</h1>
      {!currentAccount ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <p>Connected: {currentAccount}</p>
      )}

      <div className="items">
        {ITEMS.map((item, idx) => (
          <div key={idx} className="item">
            <img src={item.image} alt={item.name} width="200" />
            <h3>{item.name}</h3>
            <p>{item.price} ETH</p>
            <button onClick={() => purchase(item)}>Buy</button>
          </div>
        ))}
      </div>

      {status && <p>{status}</p>}
    </div>
  );
}

export default App;
