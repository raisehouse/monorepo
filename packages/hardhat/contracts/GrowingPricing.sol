pragma solidity 0.8.1;

import "./interfaces/IPricing.sol";

contract GrowingPricing is IPricing {

    uint256 private price;
    function nextPrice(uint256 amount, uint256 totalSold) external override returns(uint256) {
        price = price + totalSold;
        return amount * price;
    }


    function viewNextPrice(uint256 amount, uint256 totalSold) external override view returns(uint256) {
        return amount * (price + totalSold);
    }
}
