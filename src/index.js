import { Contract, ethers } from "ethers";

import usdcTknAbi from "../artifacts/contracts/USDCoin.sol/USDCoin.json";
import bbitesTokenAbi from "../artifacts/contracts/BBitesToken.sol/BBitesToken.json";
import publicSaleAbi from "../artifacts/contracts/PublicSale.sol/PublicSale.json";
import nftTknAbi from "../artifacts/contracts/CuyCollectionNft.sol/CuyCollectionNft.json";

// SUGERENCIA: vuelve a armar el MerkleTree en frontend
// Utiliza la libreria buffer
import buffer from "buffer/";
import walletAndIds from "../wallets/walletList";
import { MerkleTree } from "merkletreejs";
//import { privateDecrypt } from "crypto";
var Buffer = buffer.Buffer;
var merkleTree;

function hashToken(tokenId, account) {
  return Buffer.from(
    ethers
      .solidityPackedKeccak256(["uint256", "address"], [tokenId, account])
      .slice(2),
    "hex"
  );
}
function buildMerkleTree() {
  var elementosHasheados = walletAndIds.map(item => hashToken(item.id, item.account));
  merkleTree = new MerkleTree(elementosHasheados, ethers.keccak256, {
    sortPairs: true,
  });
}

var provider, signer, account;
var usdcTkContract, bbitesTknContract, pubSContract, nftContract;
var usdcAddress, bbitesTknAdd, pubSContractAdd;

async function setUpMetamask() {
  var bttn = document.getElementById("connect");

  var walletIdEl = document.getElementById("walletId");

  bttn.addEventListener("click", async function () {
    if (window.ethereum) {
      // valida que exista la extension de metamask conectada
      [account] = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Billetera metamask", account);
      walletIdEl.innerHTML = account;
      signer = await provider.getSigner(account);
    }
  });
}

function initSCsGoerli() {
  provider = new ethers.BrowserProvider(window.ethereum);

  usdcAddress = "0x2BF9cB870023936B0579EebC805BE9dAD534456c";
  bbitesTknAdd = "0x46d08Bd60d9Bf99Bf526a04055950563a11A72aE";
  pubSContractAdd = "0x659E13f9650A46745cAE028b71b38DdBa8b04d1C";

  usdcTkContract = new Contract(usdcAddress, usdcTknAbi.abi, provider);
  bbitesTknContract = new Contract(bbitesTknAdd, bbitesTokenAbi.abi, provider);
  pubSContract = new Contract(pubSContractAdd, publicSaleAbi.abi, provider);
}

function initSCsMumbai() {
  provider = new ethers.BrowserProvider(window.ethereum);

  var nftAddress = "0x514bed25cd992120E9926fd14D2eAC3874479Fb2";

  nftContract = new Contract(nftAddress, nftTknAbi.abi, provider);
}


function setUpListeners() {
  // Connect to Metamask

  // USDC Balance - balanceOf
  var bttn = document.getElementById("usdcUpdate");
    bttn.addEventListener("click", async function () {
    try {
        var balance = await usdcTkContract.balanceOf(account);
        var balanceEl = document.getElementById("usdcBalance");
        balanceEl.innerHTML = ethers.formatUnits(balance, 6);
    } catch (error) {
        console.error("Error al obtener el balance:", error);
    }
  });

  // Bbites token Balance - balanceOf
  var bttn = document.getElementById("bbitesTknUpdate");
  bttn.addEventListener("click", async function () {
    try {
        var balance = await bbitesTknContract.balanceOf(account);
        var balanceEl = document.getElementById("bbitesTknBalance");
        balanceEl.innerHTML = ethers.formatUnits(balance, 18);
    } catch (error) {
        console.error("Error al obtener el balance:", error);
    }
});

  // APPROVE BBTKN
  // bbitesTknContract.approve
  var bttn = document.getElementById("approveButtonBBTkn").addEventListener("click", async function () {
    try {
      const amount = ethers.parseUnits(document.getElementById("approveInput").value, 18);
      const tx = await bbitesTknContract.connect(signer).approve(pubSContractAdd, amount);
      await tx.wait();
      document.getElementById("approveError").innerHTML = "Aprobado con exito";
    } catch (error) {
        document.getElementById("approveError").innerHTML = error.message;
    }
  });

  // APPROVE USDC
  // usdcTkContract.approve
  var bttn = document.getElementById("approveButtonUSDC").addEventListener("click", async function () {
    try {
      const amount = ethers.parseUnits(document.getElementById("approveInputUSDC").value, 6);
      const tx = await usdcTkContract.connect(signer).approve(pubSContractAdd, amount);
      await tx.wait();
      document.getElementById("approveErrorUSDC").innerHTML = "Aprobado con exito";
    } catch (error) {
        document.getElementById("approveErrorUSDC").innerHTML = error.message;
    }
  });

  // purchaseWithTokens
  var bttn = document.getElementById("purchaseButton").addEventListener("click", async function () {
    try {
        const tokenId = document.getElementById("purchaseInput").value;
        const tx = await pubSContract.connect(signer).purchaseWithTokens(tokenId);
        await tx.wait();
        document.getElementById("purchaseError").innerHTML = "Compra con BBTKN exitosa";
    } catch (error) {
        document.getElementById("purchaseError").innerHTML = error.message;
    }
  });

  // purchaseWithUSDC
  var bttn = document.getElementById("purchaseButtonUSDC").addEventListener("click", async function () {
    try {
        const tokenId = document.getElementById("purchaseInputUSDC").value;
        const amount = ethers.parseUnits(document.getElementById("amountInUSDCInput").value, 6);
        const tx = await pubSContract.connect(signer).purchaseWithUSDC(tokenId, amount);
        await tx.wait();
        document.getElementById("purchaseErrorUSDC").innerHTML = "Compra con USDC exitosa";
    } catch (error) {
        document.getElementById("purchaseErrorUSDC").innerHTML = error.message;
    }
  });

  // purchaseWithEtherAndId
  var bttn = document.getElementById("purchaseButtonEtherId").addEventListener("click", async function () {
    try {
        const tokenId = document.getElementById("purchaseInputEtherId").value;
        const tx = await pubSContract.connect(signer).purchaseWithEtherAndId(tokenId, {
            value: ethers.parseEther("0.01")
        });
        await tx.wait();
        document.getElementById("purchaseEtherIdError").innerHTML = "Compra con Ether exitosa!";
    } catch (error) {
        document.getElementById("purchaseEtherIdError").innerHTML = error.message;
    }
  });
  // send Ether
  var bttn = document.getElementById("sendEtherButton").addEventListener("click", async function () {
    try {
        const tx = await pubSContract.connect(signer).depositEthForARandomNft({
            value: ethers.parseEther("0.01")
        });
        await tx.wait();
        document.getElementById("sendEtherError").innerHTML = "Ether enviado y NFT aleatorio comprado exitosamente!";
    } catch (error) {
        document.getElementById("sendEtherError").innerHTML = error.message;
    }
  });

  // getPriceForId
  var bttn = document.getElementById("getPriceNftByIdBttn").addEventListener("click", async function () {
    try {
        const tokenId = document.getElementById("priceNftIdInput").value;
        const price = await pubSContract.getPriceForId(tokenId);
        document.getElementById("priceNftByIdText").innerHTML = "El precio del NFT es: " + ethers.formatEther(price) + " Ether";
    } catch (error) {
        document.getElementById("getPriceNftError").innerHTML = error.message;
    }
  });

  // getProofs
  var bttn = document.getElementById("getProofsButtonId");
  bttn.addEventListener("click", async () => {
    var id = parseInt(document.getElementById("inputIdProofId").value);
    var address= document.getElementById("inputAccountProofId").value;
    var proofs = merkleTree.getHexProof(hashToken(id, address));
    navigator.clipboard.writeText(JSON.stringify(proofs));
  });

  // safeMintWhiteList
  var bttn = document.getElementById("safeMintWhiteListBttnId").addEventListener("click", async function () {
    try {
        const toAddress = document.getElementById("whiteListToInputId").value;
        const tokenId = document.getElementById("whiteListToInputTokenId").value;
        let proofs = document.getElementById("whiteListToInputProofsId").value;
        proofs = JSON.parse(proofs).map(ethers.hexlify);

        const tx = await nftContract.connect(signer).safeMintWhiteList(toAddress, tokenId, proofs);
        await tx.wait();
        document.getElementById("whiteListErrorId").innerHTML = "NFT minted successfully!";
    } catch (error) {
        document.getElementById("whiteListErrorId").innerHTML = error.message;
    }
  });

  // buyBack
  var bttn = document.getElementById("buyBackBttn").addEventListener("click", async function () {
    try {
        const tokenId = document.getElementById("buyBackInputId").value;
        const tx = await nftContract.connect(signer).buyBack(tokenId);
        await tx.wait();
        document.getElementById("buyBackErrorId").innerHTML = "NFT comprado y quemado exitosamente!";
    } catch (error) {
        document.getElementById("buyBackErrorId").innerHTML = error.message;
    }
  });
}

function setUpEventsContracts() {
  pubSContract.on("PurchaseNftWithId", (account, id) => {
    const listItem = document.createElement("li");
    listItem.innerText = `NFT con ID ${id} comprado por ${account}`;
    var pubSList = document.getElementById("pubSList").appendChild(listItem);
  });
  // pubSContract - "PurchaseNftWithId"

  bbitesTknContract.on("Transfer", (from, to, amount, event) => {
    const listItem = document.createElement("li");
    listItem.innerText = `Transferencia de ${ethers.formatUnits(amount, 18)} BBTKN de ${from} a ${to}`;
    var bbitesListEl = document.getElementById("bbitesTList").appendChild(listItem);
  });

  nftContract.on("Transfer", (from, to, tokenId, event) => {
    const listItem = document.createElement("li");
    listItem.innerText = `NFT con ID ${tokenId} transferido de ${from} a ${to}`;
    var nftList = document.getElementById("nftList").appendChild(listItem);
  });
  // nftCListener - "Transfer"

  nftContract.on("Burn", (account, tokenId) => {
    const listItem = document.createElement("li");
    listItem.innerText = `NFT con ID ${tokenId} quemado por ${account}`;
    var burnList = document.getElementById("burnList").appendChild(listItem);
  });
  // nftCListener - "Burn"
}

async function setUp() {
  window.ethereum.on("chainChanged", (chainId) => {
    window.location.reload();
  });

  await setUpMetamask();

  initSCsGoerli();

  initSCsMumbai();

  setUpListeners();

  setUpEventsContracts();

  buildMerkleTree();
}

setUp()
  .then()
  .catch((e) => console.log(e));
