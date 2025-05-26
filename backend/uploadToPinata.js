const axios = require("axios");
const FormData = require("form-data");
require("dotenv").config({ path: __dirname + "/.env" });

/**
 * Image upload to PINATA IPFS
 */
async function uploadImageToPinata(filename, imageBuffer) {
  try {
    const apiKey = process.env.PINATA_API_KEY;
    const apiSecret = process.env.PINATA_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error(
        "PINATA_API_KEY ou PINATA_API_SECRET não definidos no .env"
      );
    }

    const form = new FormData();
    form.append("file", imageBuffer, {
      filename: `${filename}.jpg`,
      contentType: "image/jpeg",
    });

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      form,
      {
        maxBodyLength: Infinity,
        headers: {
          ...form.getHeaders(),
          pinata_api_key: apiKey,
          pinata_secret_api_key: apiSecret,
        },
      }
    );

    const cid = response.data.IpfsHash;
    return `ipfs://${cid}`;
  } catch (err) {
    console.error(
      "🔥 Erro ao subir imagem para IPFS via Pinata:",
      err.response?.data || err.message
    );
    throw err;
  }
}

/**
 * JSON metadata Upload to Pinata IPFS
 */
async function uploadMetadataToPinata(name, imageIPFSUrl) {
  try {
    const apiKey = process.env.PINATA_API_KEY;
    const apiSecret = process.env.PINATA_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error(
        "PINATA_API_KEY or PINATA_API_SECRET not defined in .env"
      );
    }

    const metadata = {
      name,
      description: `NFT for ${name}`,
      image: imageIPFSUrl,
    };

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      metadata,
      {
        headers: {
          pinata_api_key: apiKey,
          pinata_secret_api_key: apiSecret,
        },
      }
    );

    const cid = response.data.IpfsHash;
    return `ipfs://${cid}`;
  } catch (err) {
    console.error(
      "🔥 Error uploading metadata to IPFS via Pinata:",
      err.response?.data || err.message
    );
    throw err;
  }
}

module.exports = {
  uploadImageToPinata,
  uploadMetadataToPinata,
};
