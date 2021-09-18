// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {AppStorage} from "./libraries/LibAppStorage.sol";
import {LibMeta} from "./shared/libraries/LibMeta.sol";
import {LibDiamond} from "./shared/libraries/LibDiamond.sol";
import {IDiamondCut} from "./shared/interfaces/IDiamondCut.sol";
import {IERC165} from "./shared/interfaces/IERC165.sol";
import {IDiamondLoupe} from "./shared/interfaces/IDiamondLoupe.sol";
import {IERC173} from "./shared/interfaces/IERC173.sol";

contract InitDiamond {

    AppStorage internal s;

     struct Args {
        address govTokenAddress;
    }
 
    function init(Args memory args) external {
        s.govTokenAddress = args.govTokenAddress;
        s.domainSeparator = LibMeta.domainSeparator("LTGDiamond", "V1");

        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        // adding ERC165 data
        ds.supportedInterfaces[type(IERC165).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondCut).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondLoupe).interfaceId] = true;
        ds.supportedInterfaces[type(IERC173).interfaceId] = true;
    }
}

