pragma solidity 0.8.1;

import "./interfaces/IPricing.sol";

contract OneToOnePricing is IPricing {
    function nextPrice(uint256 amount, uint256 totalSold) external override returns(uint256) {
        return amount;
    }


    function viewNextPrice(uint256 amount, uint256 totalSold) external override view returns(uint256) {
        return amount;
    }
}
