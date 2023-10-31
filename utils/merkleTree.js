const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const { ethers } = require("hardhat");
const walletAndIds = require("../wallets/walletList");

var merkleTree, root;
function hashToken(tokenId, account) {
  return Buffer.from(
    ethers
      .solidityPackedKeccak256(["uint256", "address"], [tokenId, account])
      .slice(2),
    "hex"
  );
}

function getRootFromMT() {
  var elements = walletAndIds.map(({ id,  address}) => {
    return hashToken(id, address);
  });
  merkleTree = new MerkleTree(elements, keccak256, {
    sortPairs: true,
  });

  root = merkleTree.getHexRoot();

  return root;
}

getRootFromMT();

module.exports = { getRootFromMT };
