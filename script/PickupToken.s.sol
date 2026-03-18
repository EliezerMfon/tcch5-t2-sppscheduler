// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/PickupToken.sol";

contract DeployPickupToken is Script {
    function run() external {
        string memory name = "PickupToken";
        string memory symbol = "PUK";

        vm.startBroadcast();
        PickupToken token = new PickupToken(name, symbol);
        vm.stopBroadcast();

        console.log("PickupToken deployed at:", address(token));
    }
}