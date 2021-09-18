
import React, { useState } from "react";
import {
  InputNumber,
  Upload,
  Button,
  List,
  Divider,
  Input,
  Card,
  DatePicker,
  Space,
  Slider,
  Switch,
  Progress,
  Spin,
  Select,
} from "antd";
import { SyncOutlined, UploadOutlined } from "@ant-design/icons";
import { Address, Balance, EtherInput, AddressInput, Hint, RaiseTile } from "../components";
import { parseEther, formatEther } from "@ethersproject/units";
import { Alert } from "antd";
import { ipfs, ipfsLinkFromHash } from "../helpers";
import RaiseFactoryFacetABI from "../contracts/RaiseFactoryFacet.abi";
import { useExternalContractLoader, useContractReader, useBalance } from "../hooks";

import { create as createIPFSClient } from'ipfs-http-client';
import RaiseFactoryFacetAddress from "../contracts/RaiseFactoryFacet.address";
import RaiseFactoryFacetAbi from "../contracts/RaiseFactoryFacet.abi";
import RaiseAbi from "../contracts/Raise.abi";
const ipfsClient = createIPFSClient('https://ipfs.infura.io:5001')
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

function Required() {
  return <span style={{ color: "red" }}>*</span>;
}

export default function CreateUI({
  setPurposeEvents,
  address,
  mainnetProvider,
  userSigner,
  localProvider,
  yourLocalBalance,
  price,
  tx,
  writeContracts,
}) {
  const [loading, setLoading] = useState(true);
  const inUseProvider = localProvider;
  const instance = useExternalContractLoader(inUseProvider, RaiseFactoryFacetAddress, RaiseFactoryFacetAbi);
  const raise0 = useContractReader({ RaiseFactoryFacet: instance }, "RaiseFactoryFacet", "raises", [BigInt(0)]);
  const raiseCount = useContractReader({ RaiseFactoryFacet: instance }, "RaiseFactoryFacet", "raiseCount", []);
  
  console.log(raise0);

  function showRaises() {
      let cur = raiseCount-1;
      if (raiseCount > 3) {
          cur = (raiseCount+3)-raiseCount;
      }
      let raises = [];
      console.log(`loading raises ${cur}`);
      while (cur >=0) {
          raises.push(<RaiseTile
                provider={inUseProvider}
                raiseID={cur}
                factoryInstance={instance}
                key={cur}
                />)
        
        cur = cur -1;
      }
      return raises.map(i => i);
  }


  React.useEffect(() => {
    if (raiseCount != undefined) {

        setLoading(false);
    }
  }, [raiseCount]);

  


  return (
    <div>
        <h1>Most Recent:</h1>
        {loading ?
            <Spin/>
        :
        <Space direction="horizontal">

            {showRaises()}
            </Space>
        }
    </div>

    );
}
