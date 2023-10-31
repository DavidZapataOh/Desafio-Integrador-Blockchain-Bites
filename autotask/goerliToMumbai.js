const { ethers } = require("ethers");
const {
  DefenderRelaySigner,
  DefenderRelayProvider,
} = require("@openzeppelin/defender-relay-client/lib/ethers");

exports.handler = async function (data) {
  const payload = data.request.body.events;

  const provider = new DefenderRelayProvider(data);
  const signer = new DefenderRelaySigner(data, provider, { speed: "fast" });

  var onlyEvents = payload[0].matchReasons.filter((e) => e.type === "event");
  if (onlyEvents.length === 0) return;

  var event = onlyEvents.filter((ev) =>
    ev.signature.includes("PurchaseNftWithId ")
  );

  var { account, tokenId } = event[0].params;

  var cuyNFT = "0x950ad6d8AebDb90dd57980E5cf9878F3aebd6c4a";
  var tokenAbi = ["function safeMint(address to, uint256 tokenId)"];
  var tokenContract = new ethers.Contract(cuyNFT, tokenAbi, signer);
  var tx = await tokenContract.safeMint(account, tokenId);
  var res = await tx.wait();
  return res;
};
