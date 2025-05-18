import { useState } from "react";
import { ethers } from "ethers";
import "./App.css";

const ITEMS = [
  {
    name: "Cool Cat",
    image: "/cat.jpg", // colocar esta imagem na pasta public/
    price: "0.001", // ETH
  },
  {
    name: "Alien Punk",
    image: "/alien.jpg",
    price: "0.001",
  },
];

const platformAddress = "0x2310c54F959012f5670A70f30EF67b7Bb883384D";

function App() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [status, setStatus] = useState("");

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Install MetaMask");
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setCurrentAccount(accounts[0]);
  };

  const purchase = async (item) => {
    try {
      setStatus("Waiting for MetaMask...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tx = await signer.sendTransaction({
        to: platformAddress,
        value: ethers.parseEther(item.price),
      });
      setStatus("Transaction sent. Waiting confirmation...");
      await tx.wait();
      setStatus(`Purchase sent! Tx Hash: ${tx.hash}`);
    } catch (err) {
      console.error(err);
      setStatus("Transaction failed or rejected.");
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
