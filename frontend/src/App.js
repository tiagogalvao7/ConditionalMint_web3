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
      const receipt = await tx.wait();
      setStatus(`✅ Tx confirmed! Hash: ${tx.hash}. Notifying backend...`);

      // Esperar pelo resultado do fetch
      const response = await fetch(
        "http://localhost:3001/purchase-notification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            txHash: tx.hash,
            itemName: item.name,
            imageURI: window.location.origin + item.image, // uso do URL completo
          }),
        }
      );

      if (!response.ok) {
        throw new Error("❌ Backend error: " + response.statusText);
      }

      setStatus("📨 Backend notified. NFT being processed!");
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
