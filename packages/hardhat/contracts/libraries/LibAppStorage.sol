

pragma solidity 0.8.1;
import {LibDiamond} from "../shared/libraries/LibDiamond.sol";
import {LibMeta} from "../shared/libraries/LibMeta.sol";


    struct AppStorage {
        address govTokenAddress;
        bytes32 domainSeparator;
        address[] raises;
    }

library LibAppStorage {
    function diamondStorage() internal pure returns (AppStorage storage ds) {
        assembly {
            ds.slot := 0
        }
    }
}

contract Modifiers {
    AppStorage internal s;

    modifier onlyOwner {
        LibDiamond.enforceIsContractOwner();
        _;
    }
}
