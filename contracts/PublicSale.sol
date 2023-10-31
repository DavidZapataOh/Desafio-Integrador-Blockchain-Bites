// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IUniSwapV2Router02, IBBToken} from "./Interfaces.sol";



contract PublicSale is Initializable, PausableUpgradeable, AccessControlUpgradeable, UUPSUpgradeable {
    IUniSwapV2Router02 router;
    IBBToken bbToken;
    IERC20 usdcToken;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant EXECUTER_ROLE = keccak256("EXECUTER_ROLE");

    // 00 horas del 30 de septiembre del 2023 GMT
    uint256 constant startDate = 1696032000;

    // Maximo price NFT
    uint256 constant MAX_PRICE_NFT = 90_000 * 10 ** 18;

    mapping(uint256 => bool) public purchasedNfts;

    event PurchaseNftWithId(address account, uint256 id);

    function initialize(address _bbToken, address _usdcToken, address initialOwner) public initializer {
        usdcToken = IERC20(_usdcToken);
        bbToken = IBBToken(_bbToken);
        router = IUniSwapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

        __Pausable_init();
        __AccessControl_init();

        _setupRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _setupRole(PAUSER_ROLE, initialOwner);
        _setupRole(UPGRADER_ROLE, initialOwner);
    }


    function purchaseWithTokens(uint256 _id) public {
        require(block.timestamp >= startDate, "La venta no ha empezado aun");
        require(_id <= 699, "El ID del token esta fuera del rando permitido (0 - 699)");
        require(purchasedNfts[_id] == false, "Este NFT ya fue comprado, intenta con otro id");
        uint256 precio = calculatePrice(_id);
        require(bbToken.balanceOf(msg.sender) >= precio, "Cantidad insuficiente de BBToken");
        bbToken.transferFrom(msg.sender, address(this), precio);
        purchasedNfts[_id] = true;
        emit PurchaseNftWithId(msg.sender, _id);
    }

    function purchaseWithUSDC(uint256 _id, uint256 _amountIn) external {
        require(block.timestamp >= startDate, "La venta no ha empezado aun");
        require(_id <= 699, "El ID del token esta fuera del rando permitido (0 - 699)");
        require(purchasedNfts[_id] == false, "Este NFT ya fue comprado, intenta con otro id");
        uint256 precio = calculatePrice(_id);
        usdcToken.transferFrom(msg.sender, address(this), precio);
        usdcToken.approve(address(router), _amountIn);

        address[] memory path = new address[](2);
        path[0] = address(usdcToken);
        path[1] = address(bbToken);
        uint[] memory _amounts = router.swapTokensForExactTokens(precio, _amountIn, path, address(this), block.timestamp + 3 minutes);
        
        purchasedNfts[_id] = true;
        emit PurchaseNftWithId(msg.sender, _id);

        uint256 excess = _amountIn - _amounts[0];
        if (excess > 0) {
            require(usdcToken.transfer(msg.sender, excess), "Fallo al transferir el excedente");
        }
    }

    function purchaseWithEtherAndId(uint256 _id) public payable {
        require(msg.value == 0.01 ether, "Cantidad incorrecta, envia 0.01 ether");
        require(block.timestamp >= startDate, "La venta no ha empezado aun");
        require(_id >= 700 && _id <= 999, "El ID del token esta fuera del rando permitido (700 - 999)");
        require(purchasedNfts[_id] == false, "Este NFT ya fue comprado, intenta con otro id");
        purchasedNfts[_id] = true;
        emit PurchaseNftWithId(msg.sender, _id);
    }

    function depositEthForARandomNft() public payable {
        require(msg.value == 0.01 ether, "Cantidad incorrecta, envia 0.01 ether");
        require(block.timestamp >= startDate, "La venta no ha empezado aun");

        uint256 randomId = 700 + (uint256(keccak256(abi.encodePacked(msg.sender, block.timestamp))) % 300);
        require(randomId >= 700 && randomId <= 999, "El ID del token esta fuera del rando permitido (700 - 999)");
        require(!purchasedNfts[randomId], "Este NFT ya ha sido comprado");

        purchasedNfts[randomId] = true;
        emit PurchaseNftWithId(msg.sender, randomId);
    }

    function calculatePrice(uint256 _id) internal view returns (uint256 precio){
        if(_id <= 199){
            precio = 1_000 * 10 ** 18;
        } else if (_id >= 200 && _id <= 499){
            precio = (_id * 20) * 10 ** 18;
        } else if (_id >= 500 && _id <= 699) {
            precio = (10_000 + (((block.timestamp - startDate) / 86400) * 2_000)) * 10 ** 18;
            if (precio > MAX_PRICE_NFT) precio = MAX_PRICE_NFT;
        }
    }

    function withdrawEther() public onlyRole(DEFAULT_ADMIN_ROLE){
        payable(msg.sender).transfer(address(this).balance);
    }

    function withdrawTokens() public onlyRole(DEFAULT_ADMIN_ROLE) {
        bbToken.transfer(msg.sender, bbToken.balanceOf(address(this)));
    }

    function getPriceForId(uint256 id) public view returns(uint256){
        return calculatePrice(id);
    }

    function executePermitAndPurchase(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public onlyRole(EXECUTER_ROLE) {
        bbToken.permit(owner, spender, value, deadline, v, r, s);

        uint256 randomId = 700 + (uint256(keccak256(abi.encodePacked(owner, block.timestamp))) % 300);
        
        require(!purchasedNfts[randomId], "Este NFT ya ha sido comprado");

        purchasedNfts[randomId] = true;
        emit PurchaseNftWithId(owner, randomId);
    }

    receive() external payable {
        depositEthForARandomNft();
    }

    ////////////////////////////////////////////////////////////////////////
    /////////                    Helper Methods                    /////////
    ////////////////////////////////////////////////////////////////////////

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
