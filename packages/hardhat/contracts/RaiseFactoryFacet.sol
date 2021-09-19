

pragma solidity 0.8.1;

import { AppStorage,LibAppStorage} from "./libraries/LibAppStorage.sol";
import "./Raise.sol";
contract RaiseFactoryFacet  {
    event RaiseCreated(Raise raise, uint256 id);
    bool private govTokenSet = false;
    address public govTokenAddress;
    address[] public raises;
    uint256 public raiseCount;
    address public maintainer;

    constructor() {
        maintainer = 0xE2A06daDfcb0007855224F6f63CB34e2E6be0d6C;
    }

    function setGovToken(address tk) public {
        require(!govTokenSet, "gov token already set");
        govTokenSet = true;
       govTokenAddress = tk;
    }

    modifier onlyMaintainer() {
        require(msg.sender == maintainer, "not maintainer");
        _;
    }

    function transferMaintainer(address newAddy) public onlyMaintainer {
        maintainer = newAddy;
    }

   

    function createFR(
        uint256 transferTax,
        uint256 creatorMint, 
        uint256 max, 
        string memory dataURI, 
        uint256 length, 
        uint256 start, 
        string memory name, 
        string memory symbol, 
        address pricing_,
        address whitelist_,
        uint256 maxBuy_
    ) external {
        Request memory request_ = Request( creatorMint, max, dataURI, length, start, transferTax, maxBuy_);
        Raise request = new Raise(request_, name, symbol, govTokenAddress, pricing_, whitelist_, maintainer);
        uint256 id = raises.length;
        //address[] memory raises = s.raises;
       // raises.push(address(request));
        raises.push(address(request));
        raiseCount = id+1;
       // s.raises[id] = address(request);
        emit RaiseCreated(request, id);
    }

}

