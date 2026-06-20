// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title APIEscrow - Monad-only escrow for AI/ML API marketplace
/// @notice Buyers stake MON to unlock API access; sellers withdraw earnings
contract APIEscrow {
    uint256 public constant STAKE_AMOUNT = 0.01 ether;
    uint256 public constant PLATFORM_FEE_BPS = 200;

    address public owner;

    struct Stake {
        address buyer;
        bytes32 apiId;
        uint256 amount;
        uint256 usageCount;
        bool active;
    }

    mapping(bytes32 => Stake) public stakes;
    mapping(bytes32 => address) public apiSellers;
    mapping(address => uint256) public pendingWithdrawals;

    uint256 public platformFees;

    event Staked(bytes32 indexed purchaseId, address indexed buyer, bytes32 indexed apiId, uint256 amount);
    event UsageLogged(bytes32 indexed purchaseId, uint256 newCount);
    event Withdrawn(bytes32 indexed purchaseId, address indexed buyer, uint256 amount);
    event SellerWithdrew(address indexed seller, uint256 amount);
    event APIRegistered(bytes32 indexed apiId, address indexed seller);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Register an API seller (called by backend after listing is created)
    function registerAPI(bytes32 apiId, address seller) external onlyOwner {
        apiSellers[apiId] = seller;
        emit APIRegistered(apiId, seller);
    }

    /// @notice Buyer stakes MON to purchase API access
    function stakeForAPI(bytes32 purchaseId, bytes32 apiId) external payable {
        require(msg.value == STAKE_AMOUNT, "Must stake exactly 0.01 MON");
        require(!stakes[purchaseId].active, "Already staked");

        address seller = apiSellers[apiId];
        require(seller != address(0), "API not registered");

        stakes[purchaseId] = Stake({
            buyer: msg.sender,
            apiId: apiId,
            amount: msg.value,
            usageCount: 0,
            active: true
        });

        uint256 fee = (msg.value * PLATFORM_FEE_BPS) / 10000;
        uint256 sellerShare = msg.value - fee;
        pendingWithdrawals[seller] += sellerShare;
        platformFees += fee;

        emit Staked(purchaseId, msg.sender, apiId, msg.value);
    }

    /// @notice Log API usage for analytics and seller accounting
    function logUsage(bytes32 purchaseId) external {
        require(stakes[purchaseId].active, "Stake not active");
        stakes[purchaseId].usageCount += 1;
        emit UsageLogged(purchaseId, stakes[purchaseId].usageCount);
    }

    /// @notice Buyer withdraws their stake if the seller earnings are still pending
    function withdrawStake(bytes32 purchaseId) external {
        Stake storage s = stakes[purchaseId];
        require(s.buyer == msg.sender, "Not your stake");
        require(s.active, "Already withdrawn");

        s.active = false;
        uint256 amount = s.amount;
        s.amount = 0;

        address seller = apiSellers[s.apiId];
        uint256 fee = (amount * PLATFORM_FEE_BPS) / 10000;
        uint256 sellerShare = amount - fee;

        require(pendingWithdrawals[seller] >= sellerShare, "Seller already withdrew");

        pendingWithdrawals[seller] -= sellerShare;
        platformFees -= fee;

        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Transfer failed");

        emit Withdrawn(purchaseId, msg.sender, amount);
    }

    /// @notice Seller withdraws accrued earnings
    function sellerWithdraw() external {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "Nothing to withdraw");
        pendingWithdrawals[msg.sender] = 0;

        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Transfer failed");

        emit SellerWithdrew(msg.sender, amount);
    }

    /// @notice Owner withdraws platform fees
    function withdrawFees() external onlyOwner {
        uint256 amount = platformFees;
        platformFees = 0;

        (bool ok, ) = owner.call{value: amount}("");
        require(ok, "Transfer failed");
    }

    function getStake(bytes32 purchaseId) external view returns (Stake memory) {
        return stakes[purchaseId];
    }

    function isActive(bytes32 purchaseId) external view returns (bool) {
        return stakes[purchaseId].active;
    }
}
