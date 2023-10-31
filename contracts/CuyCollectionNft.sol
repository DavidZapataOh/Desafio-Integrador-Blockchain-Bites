// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract CuyCollectionNft is Initializable, ERC721Upgradeable, ERC721BurnableUpgradeable, PausableUpgradeable, AccessControlUpgradeable, UUPSUpgradeable {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    bytes32 public root;

    event Burn(address account, uint256 id);

    function initialize(
        string memory _name,
        string memory _symbol,
        address initialOwner
    ) public initializer {
        __ERC721_init(_name, _symbol);
        __Pausable_init();
        __AccessControl_init();

        _setupRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _setupRole(PAUSER_ROLE, initialOwner);
        _setupRole(MINTER_ROLE, initialOwner);
        _setupRole(UPGRADER_ROLE, initialOwner);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://QmTWvm55znTX6NmgopdUpJX8CJsNzhGJY4bJVmMvoJP5hA/";
    }

    function safeMint(
        address to,
        uint256 tokenId
    ) public onlyRole(MINTER_ROLE) whenNotPaused{
        require(tokenId <= 999, "El ID del token esta fuera del rando permitido (0 - 999)");
        _safeMint(to, tokenId);
    }

    function safeMintWhiteList(
        address to,
        uint256 tokenId,
        bytes32[] calldata proofs
    ) public whenNotPaused{
        require(tokenId >= 1000 && tokenId <= 1999,  "El ID del token esta fuera del rando permitido (1000 - 1999)");
        require(inWhitelist(proofs, msg.sender), "No estas en la whitelist");
        _safeMint(to, tokenId);
    }

    function buyBack(uint256 id) public {
        require(ownerOf(id) == msg.sender, "No eres el propietario del token");
        require(id >= 1000 && id <= 1999,  "El ID del token esta fuera del rando permitido (1000 - 1999)");
        _burn(id);
        emit Burn(msg.sender, id);
    }

    function setRoot(bytes32 _root) public {
        root = _root;
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // The following functions are overrides required by Solidity.
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721Upgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function inWhitelist(bytes32[] memory _proof, address _owner) public view returns (bool) {
        return MerkleProof.verify(_proof, root, keccak256(abi.encodePacked(_owner)));
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
