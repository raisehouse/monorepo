pragma solidity 0.8.1;

import "./interfaces/IPricing.sol";

contract FixedPricing is IPricing {
    //this one should only be used with a no decimals token
    function nextPrice(uint256 amount, uint256 totalSold) external override returns(uint256) {
        require(amount >= 3000000000000000, "insuffient amount");
        return amount / 3000000000000000;
    }


    function viewNextPrice(uint256 amount, uint256 totalSold) external override view returns(uint256) {
        require(amount >= 3000000000000000, "insuffient amount");
        return amount / 3000000000000000;
    }
}