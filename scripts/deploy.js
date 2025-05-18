const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const ConditionalMint = await hre.ethers.getContractFactory(
    "ConditionalMint"
  );
  const contract = await ConditionalMint.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("✅ Contract deployed to:", contractAddress);

  // Export ABI to backend folder
  fs.writeFileSync(
    "backend/abi.json",
    JSON.stringify(contract.interface.formatJson(), null, 2)
  );

  // Optionally save the address too
  fs.writeFileSync("backend/contract-address.txt", contractAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
