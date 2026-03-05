//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/PickupToken.sol";

contract PickupTokenTest is Test {
    PickupToken token;
    address owner = address (this);
    address agent = address (0x1);
    address customer = address (0x2);

    uint256 constant INITIAL_SUPPLY = 1_000_000;

    function setUp() public{
        token = new PickupToken(
            "PickupToken",
            "PIK"
        );
    }
    /* DEPLOYMENT */
    function testInitialSupplyMintedToOwner() public {
        uint256 expectedSupply = INITIAL_SUPPLY * 10 ** token.decimals();
        assertEq(token.totalSupply(),expectedSupply);
        assertEq(token.balanceOf(owner),expectedSupply);
    }
    /* TRANSFERS */
    function testTransferBetweenWallets() public {
        uint256 amount = 1_000 * 10 ** token. decimals();
        token.transfer(agent, amount);

        assertEq(token.balanceOf(agent), amount);
        assertEq(
            token.balanceOf(owner),
            token.totalSupply() - amount
        );
    }
    /* MINTING */

    function testOwnerCanMint() public {
        uint256 amount = 500 * 10 ** token.decimals();
        token.mint(customer, amount);
        assertEq(token.balanceOf(customer), amount);
    }
    function testOwnerCannotMint() public {
        vm.prank(agent);
        vm.expectRevert();
        token.mint(agent, 100);
    }
    /* PAUSING */

    function testPauseBlocksTransfers() public {
        token.pause();
        vm.expectRevert();
        token.transfer(agent, 100);
    }
    function testUnpauseAllowsTransfers() public {
        token.pause();
        token.unpause();
        token.transfer(agent, 100);
        assertEq(token.balanceOf(agent),100);
    }

    /* BURNING */

    function testBurnReducesTotalSupply() public {
        uint burnAmount = 1_000 * 10 ** token. decimals();
        uint256 supplyBefore = token.totalSupply();

        token.burn(burnAmount);
        assertEq(
            token.totalSupply(),
            supplyBefore - burnAmount
        );
    }
}