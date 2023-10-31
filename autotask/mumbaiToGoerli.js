const { ethers } = require("ethers");
const {
  DefenderRelaySigner,
  DefenderRelayProvider,
} = require("@openzeppelin/defender-relay-client/lib/ethers");

exports.handler = async function (data) {
  const payload = data.request.body.events;

  var onlyEvents = payload[0].matchReasons.filter((e) => e.type === "event");
  if (onlyEvents.length === 0) return;

  var event = onlyEvents.filter((ev) =>
    ev.signature.includes("Burn")
  );

  var { account } = event[0].params;

  var publicSale = "0x46d08Bd60d9Bf99Bf526a04055950563a11A72aE";
  var tokenAbi = ["function mint(address account)"];
  var tokenContract = new ethers.Contract(publicSale, tokenAbi, signer);
  var tx = await tokenContract.mint(account);
  var res = await tx.wait();
  return res;
};
