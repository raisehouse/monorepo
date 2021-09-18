pragma solidity 0.8.1;

import {ERC20} from "./shared/ERC20.sol";

contract Benies is ERC20 {
    
    constructor(string memory name_, string memory symbol_) public ERC20(name_, symbol_) {
        _mint(msg.sender, 6000000000000000000000);// 6000
    }

}
