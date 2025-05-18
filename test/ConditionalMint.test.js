const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ConditionalMint", function () {
  let conditionalMint, owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    const ConditionalMint = await ethers.getContractFactory("ConditionalMint");
    conditionalMint = await ConditionalMint.deploy();
    await conditionalMint.waitForDeployment(); // necessário para ethers v6+
  });

  it("should accept ETH and store purchase on buyItem", async function () {
    const name = "Item 1";
    const imageURI = "ipfs://fake-image-hash";
    const value = ethers.parseEther("0.1");

    const tx = await conditionalMint
      .connect(user)
      .buyItem(name, imageURI, { value });
    const receipt = await tx.wait();

    // Capturar o evento para extrair o txHash gerado no contrato
    const event = receipt.logs
      .map((log) => conditionalMint.interface.parseLog(log))
      .find((e) => e.name === "PurchaseInitiated");

    expect(event).to.exist;

    const txHash = event.args.txHash;
    const purchase = await conditionalMint.pendingPurchases(txHash);

    expect(purchase.buyer).to.equal(user.address);
    expect(purchase.name).to.equal(name);
    expect(purchase.imageURI).to.equal(imageURI);
    expect(purchase.value).to.equal(value);
  });
});

it("should allow owner to mint NFT and map tokenId to purchaseHash", async function () {
  const name = "Item 2";
  const imageURI = "ipfs://image-2";
  const value = ethers.parseEther("0.2");

  const buyTx = await conditionalMint
    .connect(user)
    .buyItem(name, imageURI, { value });
  const receipt = await buyTx.wait();

  const event = receipt.logs
    .map((log) => conditionalMint.interface.parseLog(log))
    .find((e) => e.name === "PurchaseInitiated");

  const txHash = event.args.txHash;

  const tokenURI = "ipfs://metadata-2";
  await expect(
    conditionalMint.connect(owner).safeMint(user.address, tokenURI, txHash)
  ).to.emit(conditionalMint, "Minted");

  const tokenId = 0;
  expect(await conditionalMint.ownerOf(tokenId)).to.equal(user.address);
  expect(await conditionalMint.tokenIdToPurchaseHash(tokenId)).to.equal(txHash);
});

it("should allow owner to refund and delete pending purchase", async function () {
  const name = "Item 3";
  const imageURI = "ipfs://image-3";
  const value = ethers.parseEther("0.3");

  const buyTx = await conditionalMint
    .connect(user)
    .buyItem(name, imageURI, { value });
  const receipt = await buyTx.wait();

  const event = receipt.logs
    .map((log) => conditionalMint.interface.parseLog(log))
    .find((e) => e.name === "PurchaseInitiated");

  const txHash = event.args.txHash;

  const userBalanceBefore = await ethers.provider.getBalance(user.address);

  const refundTx = await conditionalMint
    .connect(owner)
    .refund(user.address, value, txHash);
  await refundTx.wait();

  expect(await conditionalMint.pendingPurchases(txHash)).to.deep.equal([
    ethers.ZeroAddress,
    "",
    "",
    0n,
  ]);
});
