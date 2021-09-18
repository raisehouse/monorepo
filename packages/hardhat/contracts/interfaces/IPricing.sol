pragma solidity 0.8.1;

import {ERC20} from "../shared/ERC20.sol";

interface IPricing {
    //amount is eth to spend return value is tokens to recieve
    function nextPrice(uint256 amount, uint256 totalSold) external returns(uint256);

    /* 
    @dev should return the same value as nextPrice but without making any state changes
     */
    function viewNextPrice(uint256 amount, uint256 totalSold) external view returns(uint256);
}
