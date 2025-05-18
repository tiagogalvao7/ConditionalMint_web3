// uploadToIPFS.js
const { Web3Storage, File } = require("web3.storage");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

// Load your Web3.Storage API token from .env
const WEB3_STORAGE_TOKEN = process.env.WEB3_STORAGE_TOKEN;

function getWeb3Client() {
  return new Web3Storage({ token: WEB3_STORAGE_TOKEN });
}

async function uploadImageToIPFS(imageUrl) {
  const res = await axios.get(imageUrl, { responseType: "arraybuffer" });
  const contentType = res.headers["content-type"] || "image/jpeg";
  const imageBuffer = Buffer.from(res.data);
  const imageName = uuidv4() + path.extname(imageUrl);

  const files = [new File([imageBuffer], imageName, { type: contentType })];
  const client = getWeb3Client();
  const cid = await client.put(files);
  return `ipfs://${cid}/${imageName}`;
}

async function uploadMetadataToIPFS(name, imageIPFS) {
  const metadata = {
    name,
    description: `NFT minted for purchase of ${name}`,
    image: imageIPFS,
  };

  const file = new File(
    [JSON.stringify(metadata)],
    `${name.replace(/\s+/g, "_")}_metadata.json`,
    { type: "application/json" }
  );

  const client = getWeb3Client();
  const cid = await client.put([file]);
  return `ipfs://${cid}/${file.name}`;
}

module.exports = { uploadImageToIPFS, uploadMetadataToIPFS };
