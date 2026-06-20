// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

abstract contract Ownable {
    address private _owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    constructor(address initialOwner) {
        _owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }
    modifier onlyOwner() {
        require(owner() == msg.sender, "Ownable: caller is not the owner");
        _;
    }
    function owner() public view virtual returns (address) {
        return _owner;
    }
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

contract ReputationEngine is Ownable {
    struct ReputationData {
        uint256 totalScore;
        uint256 tasksCompleted;
        uint256 tasksFailed;
        uint256 totalQualityPoints;
        uint256 streakCount;
        uint256 bestStreak;
        uint256 lastTaskTimestamp;
    }
    
    enum Badge { None, Bronze, Silver, Gold, Platinum, Diamond }
    
    mapping(uint256 => ReputationData) public reputations;
    
    mapping(address => bool) public authorizedCallers;

    modifier onlyAuthorized() {
        require(msg.sender == owner() || authorizedCallers[msg.sender], "Not authorized");
        _;
    }
    
    uint256 public constant BRONZE    = 100;
    uint256 public constant SILVER    = 500;
    uint256 public constant GOLD      = 1500;
    uint256 public constant PLATINUM  = 5000;
    uint256 public constant DIAMOND   = 15000;
    
    event TaskRecorded(uint256 indexed agentId, uint256 pointsEarned, uint256 newTotal);
    event FailureRecorded(uint256 indexed agentId, uint256 pointsLost, uint256 newTotal);
    event BadgeEarned(uint256 indexed agentId, Badge badge);
    
    // In production, ownership should be transferred to TaskEscrow or an access manager
    constructor() Ownable(msg.sender) {}
    
    function setAuthorizedCaller(address caller, bool status) external onlyOwner {
        authorizedCallers[caller] = status;
    }
    
    function recordCompletion(uint256 agentId, uint256 qualityScore) external onlyAuthorized {
        ReputationData storage rep = reputations[agentId];
        rep.tasksCompleted++;
        rep.totalQualityPoints += qualityScore;
        rep.streakCount++;
        if (rep.streakCount > rep.bestStreak) rep.bestStreak = rep.streakCount;
        
        uint256 streakBonus = rep.streakCount >= 5 ? 10 : 0;
        uint256 points = qualityScore + streakBonus;
        rep.totalScore += points;
        rep.lastTaskTimestamp = block.timestamp;
        
        emit TaskRecorded(agentId, points, rep.totalScore);
        
        Badge b = _getBadge(rep.totalScore);
        if (b != Badge.None) emit BadgeEarned(agentId, b);
    }
    
    function recordFailure(uint256 agentId) external onlyAuthorized {
        ReputationData storage rep = reputations[agentId];
        rep.tasksFailed++;
        rep.streakCount = 0;
        uint256 penalty = rep.totalScore / 10;
        rep.totalScore = rep.totalScore > penalty ? rep.totalScore - penalty : 0;
        rep.lastTaskTimestamp = block.timestamp;
        emit FailureRecorded(agentId, penalty, rep.totalScore);
    }
    
    function getReputation(uint256 agentId) external view returns (ReputationData memory) {
        return reputations[agentId];
    }
    
    function getBadge(uint256 agentId) external view returns (Badge) {
        return _getBadge(reputations[agentId].totalScore);
    }
    
    function _getBadge(uint256 score) internal pure returns (Badge) {
        if (score >= DIAMOND)  return Badge.Diamond;
        if (score >= PLATINUM) return Badge.Platinum;
        if (score >= GOLD)     return Badge.Gold;
        if (score >= SILVER)   return Badge.Silver;
        if (score >= BRONZE)   return Badge.Bronze;
        return Badge.None;
    }
}