//SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import "forge-std/Script.sol";
import "../src/PickupToken.sol";

contract DeployPickupToken is Script {
    function run() external {
        string memory name = "PickupToken";
        string memory symbol = "PIK";
        uint256 initialSupply = 1_000_000;

        vm.startBroadcast();
        PickupToken token = new PickupToken(name, symbol, initialSupply);
        vm.stopBroadcast();
    }
}