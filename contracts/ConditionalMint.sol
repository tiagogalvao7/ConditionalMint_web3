// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import the ERC721URIStorage contract from OpenZeppelin, which provides basic implementation of ERC721 with URI storage.
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
// Import the Ownable contract from OpenZeppelin, which provides basic access control mechanism, where only the owner can perform certain actions.
import "@openzeppelin/contracts/access/Ownable.sol";

// Define the contract named ConditionalMint, inheriting functionalities from ERC721URIStorage and Ownable.
contract ConditionalMint is ERC721URIStorage, Ownable {
    // Counter to keep track of the next token ID to be minted. Initialized to 0.
    uint256 private _tokenIdCounter;

    // Struct to represent a pending purchase with the buyer's address, item name, image URI, and the value sent.
    struct Purchase {
        address buyer;
        string name;
        string imageURI;
        uint256 value;
    }

    // Mapping to store pending purchases using a unique transaction hash (bytes32) as the key and the Purchase struct as the value.
    mapping(bytes32 => Purchase) public pendingPurchases;
    // Mapping to associate a minted token ID (uint256) with the original purchase transaction hash (bytes32).
    mapping(uint256 => bytes32) public tokenIdToPurchaseHash;

    // Event emitted when a purchase is initiated. Indexed txHash allows for efficient filtering of events based on the transaction.
    event PurchaseInitiated(bytes32 indexed txHash, address buyer, string name, string imageURI, uint256 value);
    // Event emitted when an NFT is successfully minted. Indexed to allows for efficient filtering by the recipient's address.
    event Minted(address indexed to, uint256 tokenId, bytes32 purchaseHash);
    // Event emitted when a refund is processed. Indexed to allows for efficient filtering by the recipient's address.
    event Refunded(address indexed to, uint256 amount, bytes32 purchaseHash);

    // Constructor that initializes the ERC721 token with a name "ConditionalMintToken" and a symbol "CMT".
    // It also sets the deployer of the contract as the owner using the Ownable constructor.
    constructor() ERC721("ConditionalMintToken", "CMT") Ownable(msg.sender) {}

    // Fallback function allowing the contract to receive Ether without a specific function call.
    receive() external payable {}

    // Function allowing a user to 'buy' an item by sending Ether.
    function buyItem(string memory _name, string memory _imageURI) public payable {
        // Ensure that the Ether value sent is greater than zero.
        require(msg.value > 0, "ETH value must be greater than zero");

        // Generate a unique hash for this purchase using the sender's address, block timestamp, item name, image URI, and the value sent.
        bytes32 txHash = keccak256(abi.encodePacked(msg.sender, block.number, _name, _imageURI, msg.value, address(this).balance));
        // Store the details of the purchase in the pendingPurchases mapping using the generated transaction hash as the key.
        pendingPurchases[txHash] = Purchase(msg.sender, _name, _imageURI, msg.value);

        // Emit a PurchaseInitiated event with the transaction hash and the details of the purchase.
        emit PurchaseInitiated(txHash, msg.sender, _name, _imageURI, msg.value);
    }

    // Internal function to mint a new NFT. Can only be called from within this contract.
    function mintNFT(address _to, string memory _tokenURI, bytes32 _purchaseHash) internal {
        // Get the current token ID from the counter.
        uint256 tokenId = _tokenIdCounter;
        // Increment the token ID counter for the next mint.
        _tokenIdCounter++;
        // Mint the new NFT to the specified address (_to) with the generated tokenId.
        _safeMint(_to, tokenId);
        // Set the URI (metadata location, likely on IPFS) for the newly minted token. This function is provided by ERC721URIStorage.
        _setTokenURI(tokenId, _tokenURI);
        // Associate the minted tokenId with the original purchase transaction hash.
        tokenIdToPurchaseHash[tokenId] = _purchaseHash;
        // Emit a Minted event with the recipient address, the new tokenId, and the purchase hash.
        emit Minted(_to, tokenId, _purchaseHash);
    }

    // Public function that allows the owner of the contract to call the internal mintNFT function.
    function safeMint(address _to, string memory _tokenURI, bytes32 _purchaseHash) public onlyOwner {
        // Only the owner (as defined by the Ownable contract) can call the internal mintNFT function.
        mintNFT(_to, _tokenURI, _purchaseHash);
    }

    // Public function that allows the owner of the contract to refund Ether to a buyer.
    function refund(address payable _to, uint256 _amount, bytes32 _purchaseHash) public onlyOwner {
        // Attempt to send the specified amount of Ether back to the buyer (_to). The 'call' function is used for sending Ether.
        (bool success, ) = _to.call{value: _amount}("");
        // If the Ether transfer fails, revert the transaction with an error message.
        require(success, "ETH transfer failed");
        // Emit a Refunded event with the recipient address, the amount refunded, and the purchase hash.
        emit Refunded(_to, _amount, _purchaseHash);
        // Remove the purchase details from the pendingPurchases mapping as the purchase is now resolved (either minted or refunded).
        delete pendingPurchases[_purchaseHash];
    }
}