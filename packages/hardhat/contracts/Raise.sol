pragma solidity 0.8.1;

import {ERC20} from "./shared/ERC20.sol";
import {IPricing} from "./interfaces/IPricing.sol";
import {IWhiteList} from "./interfaces/IWhitelist.sol";

interface IRaise {
    function apeIn() external payable;
}

interface ITaxFree {
    function checkIsTaxEnabled() external view returns(bool);
    function  flipTaxSwitch() external;
    function addTaxFree(address addy) external;
}



struct Request {
    uint256 creatorMint;//amount to mint for Raise creator
    uint256 max;
    string dataURI; //should be json with description: string, image: url, link: url keys
    uint256 length;//length request is open in seconds
    uint256 startTime;//start date
    uint256 transferTax;//10 = 10%, 20 = 5%
    uint256 maxBuy;//maximum amount each address can buy
}

contract Raise is IRaise, ERC20, ITaxFree {
  
    
   

    address public raiseGov;
    IPricing public pricing;
    IWhiteList public whitelist;
    Request public data;
    uint256 public endTime;
    uint256 public totalRaised;
    address payable public creator;
    mapping(address=>uint256) amountBought;
    uint constant private BIPS_DIVISOR = 10000;
    mapping(address=>bool) private isTaxFree;
    bool private txTaxEnabled;

    modifier onlyCreator() {
        require(creator == _msgSender(), "not creator");
        _;
    }
   

    
    constructor(Request memory request_, string memory name_, string memory symbol_, address gov_, address pricing_, address whitelist_, address maintainer_) public ERC20(name_, symbol_) {
        creator = payable(tx.origin);
        raiseGov = gov_;
        pricing = IPricing(pricing_);
        whitelist = IWhiteList(whitelist_);
        endTime = request_.startTime + request_.length;
        data = request_;
        if (request_.transferTax != 0) {
            txTaxEnabled = true;
        }
        if (request_.creatorMint > 0) {
            _mint(tx.origin, request_.creatorMint);
            _mint(maintainer_, (request_.creatorMint / 1000));
        }
    }

    function addTaxFree(address addy) external override onlyCreator {
        isTaxFree[addy] = true;
    }

    function checkIsTaxFree(address addy) public view returns(bool){
        if (txTaxEnabled) {
            return isTaxFree[addy];
        } else {
            return true;
        }
    }


    function checkIsTaxEnabled() external override view returns(bool) {
        return txTaxEnabled;
    }

    function  flipTaxSwitch() external override {
        txTaxEnabled = !txTaxEnabled;
    }

    

    function transfer(address recipient, uint256 amount) public override returns (bool) {
       
       if (checkIsTaxFree(_msgSender()) || checkIsTaxFree(recipient)) {
            _transfer(_msgSender(), recipient, amount);
       } else {
            uint256 afterTax = applyTransferTax(amount);
            if (amount-afterTax != 0) {
                _transfer(_msgSender(), creator, amount-afterTax);
            }
            _transfer(_msgSender(), recipient, amount);
       }
        return true;
    } 

    function applyTransferTax(uint256 amount) public view returns (uint) {
        if (data.transferTax > 0) {
            return amount - ((amount * data.transferTax) / BIPS_DIVISOR);
        }
        return amount;
    }

     function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public override returns (bool) { 
        

        if (checkIsTaxFree(_msgSender()) || checkIsTaxFree(recipient)) {
            _transfer(sender, recipient, amount);
        } else {
            uint256 afterTax = applyTransferTax(amount);
            if (amount-afterTax != 0) {
                _transfer(sender, creator, amount-afterTax);
            }
            _transfer(sender, recipient, amount);
       }

        uint256 currentAllowance = allowance(sender,_msgSender());
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        unchecked {
            _approve(sender, _msgSender(), currentAllowance - amount);
        }

        return true;
    }



    function whitelisted(address ape) public view returns(bool) {
        if (whitelist.isApproved(ape)) {
            return true;
        }

        if (raiseGov == 0x0000000000000000000000000000000000000000) {
            return false;
        } else {
            ERC20 gov = ERC20(raiseGov);
            return gov.balanceOf(ape) >= 1000000000000000000;
        }
    }

    function okToApe(address ape) public view returns(bool) {
        if (block.timestamp < endTime) {
            if (block.timestamp > data.startTime) {
                return true;
            } else if (whitelisted(ape)) {
                return true;
            } else {
                return false;
            }
        } 
        return false;
    }

    function belowMax(uint256 value) public view returns(bool) {
        if (data.max == 0) {
            return true;
        } else {
            return value+totalRaised <= data.max;
        }
    }

    function notOverLimit(address ape, uint256 amount) public view returns(bool) {
        if (data.maxBuy != 0) {
            if (amountBought[ape]+amount > data.maxBuy) {
                return false;
            } else {
                return true;
            }
        }
        return true;
    }


    function apeIn() external override payable {
        require(okToApe(msg.sender), "Not able to ape in right now");
        require(belowMax(msg.value), "to much for this request");
        uint256 amount = pricing.nextPrice(msg.value, totalSupply());
        require(notOverLimit(msg.sender, amount), "this address has already bought as much as they can from this raise");
        if (data.maxBuy != 0) {
            amountBought[msg.sender] = amountBought[msg.sender]+amount;
        }
        _mint(msg.sender, amount);
        totalRaised = totalRaised + msg.value;
        creator.transfer(msg.value);
    }



}
