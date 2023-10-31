require("dotenv").config();

const {
  getRole,
  verify,
  ex,
  printAddress,
  deploySC,
  deploySCNoUp,
} = require("../utils");

const { getRootFromMT } = require("../utils/merkleTree");

var MINTER_ROLE = getRole("MINTER_ROLE");
var BURNER_ROLE = getRole("BURNER_ROLE");
var owner = "0x5a4e9Bb1f224e8254C1d63e90dE34E8572f8dC71";

// Publicar NFT en Mumbai
async function deployMumbai() {
  var relAddMumbai = "0xb945c5ECDaDF11319a6852F22BbAc012bCb2C513"; // relayer mumbai
  var name = "CuyCollectionNft";
  var symbol = "CUY";

  // utiliza deploySC
  var cuyNFT = await deploySC("CuyCollectionNft", [name, symbol, owner]);
  // utiliza printAddress
  var implAdd = await printAddress("CuyCollectionNft", await cuyNFT.getAddress());
  // utiliza ex
  await ex(cuyNFT, "grantRole", [MINTER_ROLE, relAddMumbai]);
  // utiliza ex
  var root = getRootFromMT();
  await ex(cuyNFT, "setRoot", [root]);
  // utiliza verify
  await verify(implAdd, "CuyCollectionNft");
}

// Publicar UDSC, Public Sale y Bbites Token en Goerli
async function deployGoerli() {
  var relAddGoerli = "0xb44D0959045bF39a5567C3a58Ef91280b61E928E"; // relayer goerli

  // var bbitesToken Contrato
  // deploySC;
  var bbitesToken = await deploySC("BBitesToken", []);
  var implBT = await printAddress("BBitesToken", await bbitesToken.getAddress());

  // var usdc Contrato
  var usdc = await deploySCNoUp("USDCoin", []);
  var implUSDC = await usdc.getAddress();

  // var psC Contrato
  // deploySC;
  var psC = await deploySC("PublicSale", [await bbitesToken.getAddress(), await usdc.getAddress(), owner]);
  var implPS = await printAddress("PublicSale", await psC.getAddress());

  // set up
  // script para verificacion del contrato
  await verify(implBT, "BBitesToken");
  await verify(implPS, "PublicSale");
  await verify(implUSDC, "USDCoin");
}

  // deployMumbai()
deployGoerli()
  //
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
