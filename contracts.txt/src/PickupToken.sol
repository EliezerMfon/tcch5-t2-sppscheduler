// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";

contract PickupToken is ERC20, ERC2OBurnable, ERC2OPausable, Ownable {
    uint256 public constant MAX_SUPPLY =1_000_000 * 10**18;
    uint256 public totalMinted;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        _mint(msg.sender, initialSupply *10 **decimals());
        totalMinted = initialSupply *10 ** decimals(); 
    }
    function pause() external onlyOwner {
        _pause();
    }
    function unpause() external onlyOwner {
        _unpause();
    }
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        totalMinted += amount;
    }
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Pausable) {
        super._update(from, to, value);
    }
    function remainingSupply() public view returns (uint256) {
        return MAX_SUPPLY - totalMinted;
    }
}