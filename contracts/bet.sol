// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract YesNoBettingSystem {
    address public owner;
    uint256 public totalBetsYes;
    uint256 public totalBetsNo;
    uint256 public numberOfBets;
    bool public bettingOpen;
    bool public resultDeclared;
    bool public finalResult;

    struct Player {
        uint256 amountBet;
        bool betOnYes;
    }

    mapping(address => Player) public playerInfo;
    address[] public players;

    event BetPlaced(address player, uint256 amount, bool betOnYes);
    event ResultDeclared(bool result);
    event WinningsPaid(address player, uint256 amount);

    constructor() {
        owner = msg.sender;
        bettingOpen = true;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier bettingIsOpen() {
        require(bettingOpen, "Betting is closed");
        _;
    }

    function bet(bool _betOnYes) public payable bettingIsOpen {
        require(msg.value > 0, "Bet amount must be greater than 0");
        require(playerInfo[msg.sender].amountBet == 0, "Player has already bet");

        playerInfo[msg.sender] = Player(msg.value, _betOnYes);
        players.push(msg.sender);

        if (_betOnYes) {
            totalBetsYes += msg.value;
        } else {
            totalBetsNo += msg.value;
        }

        numberOfBets++;
        emit BetPlaced(msg.sender, msg.value, _betOnYes);
    }

    function closeBetting() public onlyOwner {
        bettingOpen = false;
    }

    function declareResult(bool _result) public onlyOwner {
        require(!bettingOpen, "Close betting before declaring result");
        require(!resultDeclared, "Result has already been declared");

        finalResult = _result;
        resultDeclared = true;
        emit ResultDeclared(_result);

        uint256 losingPool = finalResult ? totalBetsNo : totalBetsYes;
        uint256 winningPool = finalResult ? totalBetsYes : totalBetsNo;

        for (uint256 i = 0; i < players.length; i++) {
            address payable playerAddress = payable(players[i]);
            Player storage bettor = playerInfo[playerAddress];

            if (bettor.betOnYes == finalResult) {
                uint256 winAmount = bettor.amountBet + (bettor.amountBet * losingPool / winningPool);
                playerAddress.transfer(winAmount);
                emit WinningsPaid(playerAddress, winAmount);
            }
        }

        // Reset contract state
        delete players;
        totalBetsYes = 0;
        totalBetsNo = 0;
        numberOfBets = 0;
        bettingOpen = true;
        resultDeclared = false;
    }

    function withdrawFees() public onlyOwner {
        require(resultDeclared, "Cannot withdraw before result is declared");
        uint256 fees = address(this).balance;
        payable(owner).transfer(fees);
    }

    function getContractBalance() public view returns(uint256) {
        return address(this).balance;
    }
}