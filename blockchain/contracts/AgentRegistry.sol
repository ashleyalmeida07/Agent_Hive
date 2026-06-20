// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

interface IERC721 is IERC165 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool _approved) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

abstract contract ERC721 is IERC721 {
    string private _name;
    string private _symbol;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC721).interfaceId || interfaceId == type(IERC165).interfaceId;
    }

    function balanceOf(address owner) public view virtual override returns (uint256) {
        require(owner != address(0), "ERC721: address zero is not a valid owner");
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) public view virtual override returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "ERC721: invalid token ID");
        return owner;
    }

    function name() public view virtual returns (string memory) {
        return _name;
    }

    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    function approve(address to, uint256 tokenId) public virtual override {
        address owner = ERC721.ownerOf(tokenId);
        require(to != owner, "ERC721: approval to current owner");
        require(msg.sender == owner || isApprovedForAll(owner, msg.sender), "ERC721: approve caller is not owner nor approved for all");
        _approve(to, tokenId);
    }

    function getApproved(uint256 tokenId) public view virtual override returns (address) {
        require(_owners[tokenId] != address(0), "ERC721: invalid token ID");
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) public virtual override {
        require(msg.sender != operator, "ERC721: approve to caller");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address owner, address operator) public view virtual override returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public virtual override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: caller is not token owner or approved");
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public virtual override {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory /* data */) public virtual override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: caller is not token owner or approved");
        _transfer(from, to, tokenId);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view virtual returns (bool) {
        address owner = ERC721.ownerOf(tokenId);
        return (spender == owner || isApprovedForAll(owner, spender) || getApproved(tokenId) == spender);
    }

    function _mint(address to, uint256 tokenId) internal virtual {
        require(to != address(0), "ERC721: mint to the zero address");
        require(_owners[tokenId] == address(0), "ERC721: token already minted");

        _balances[to] += 1;
        _owners[tokenId] = to;
        emit Transfer(address(0), to, tokenId);
    }

    function _safeMint(address to, uint256 tokenId) internal virtual {
        _mint(to, tokenId);
    }

    function _transfer(address from, address to, uint256 tokenId) internal virtual {
        require(ERC721.ownerOf(tokenId) == from, "ERC721: transfer from incorrect owner");
        require(to != address(0), "ERC721: transfer to the zero address");

        delete _tokenApprovals[tokenId];
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    function _approve(address to, uint256 tokenId) internal virtual {
        _tokenApprovals[tokenId] = to;
        emit Approval(ERC721.ownerOf(tokenId), to, tokenId);
    }
}

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

contract AgentRegistry is ERC721, Ownable {
    struct Agent {
        string agentType;
        string name;
        string capabilities; // JSON string
        uint256 reputationScore;
        uint256 tasksCompleted;
        uint256 tasksFailed;
        uint256 totalEarnings;
        address agentWallet;
        uint256 createdAt;
        bool isActive;
    }

    mapping(uint256 => Agent) public agents;
    uint256 public nextAgentId;

    mapping(address => bool) public authorizedCallers;

    modifier onlyAuthorized() {
        require(msg.sender == owner() || authorizedCallers[msg.sender], "Not authorized");
        _;
    }

    event AgentRegistered(uint256 indexed agentId, address indexed owner, string agentType, string name);
    event ReputationUpdated(uint256 indexed agentId, uint256 oldScore, uint256 newScore);
    event EarningsRecorded(uint256 indexed agentId, uint256 amount);
    event AgentStatusChanged(uint256 indexed agentId, bool isActive);
    
    constructor() ERC721("AgentHive Agent", "AGENT") Ownable(msg.sender) {}

    function registerAgent(
        string memory agentType,
        string memory name,
        string memory capabilities,
        address wallet
    ) external returns (uint256) {
        uint256 agentId = nextAgentId++;
        _safeMint(msg.sender, agentId);

        Agent storage a = agents[agentId];
        a.agentType = agentType;
        a.name = name;
        a.capabilities = capabilities;
        a.reputationScore = 0;
        a.tasksCompleted = 0;
        a.tasksFailed = 0;
        a.totalEarnings = 0;
        a.agentWallet = wallet;
        a.createdAt = block.timestamp;
        a.isActive = true;

        emit AgentRegistered(agentId, msg.sender, agentType, name);
        return agentId;
    }

    function setAgentStatus(uint256 agentId, bool status) external {
        require(ownerOf(agentId) == msg.sender || owner() == msg.sender, "Not authorized");
        agents[agentId].isActive = status;
        emit AgentStatusChanged(agentId, status);
    }

    function setAuthorizedCaller(address caller, bool status) external onlyOwner {
        authorizedCallers[caller] = status;
    }

    // These functions use onlyAuthorized to simulate system access control
    function updateReputation(uint256 agentId, uint256 newScore) external onlyAuthorized {
        uint256 oldScore = agents[agentId].reputationScore;
        agents[agentId].reputationScore = newScore;
        emit ReputationUpdated(agentId, oldScore, newScore);
    }

    function recordEarnings(uint256 agentId, uint256 amount) external onlyAuthorized {
        agents[agentId].totalEarnings += amount;
        agents[agentId].tasksCompleted++;
        emit EarningsRecorded(agentId, amount);
    }

    function recordFailure(uint256 agentId) external onlyAuthorized {
        agents[agentId].tasksFailed++;
    }

    function getAgent(uint256 agentId) external view returns (Agent memory) {
        return agents[agentId];
    }

    function getAgentWallet(uint256 agentId) external view returns (address) {
        return agents[agentId].agentWallet;
    }
}