
import React, { useState } from "react";
import {
  InputNumber,
  Upload,
  Button,
  List,
  Divider,
  Image,
  Input,
  Card,
  DatePicker,
  Space,
  Slider,
  Switch,
  Progress,
  Spin,
  Select,
  Layout,
  Modal,
  Row
} from "antd";

const { Header, Footer, Sider, Content } = Layout;
import { Link } from "react-router-dom";
import axios from "axios";
import { SyncOutlined, UploadOutlined } from "@ant-design/icons";
import { Address, Balance, EtherInput, AddressInput, Hint, RelationToNow } from "../components";
import { parseEther, formatEther } from "@ethersproject/units";
import { Alert } from "antd";
import { ipfs, ipfsLinkFromHash, relationToNow, truncateString } from "../helpers";
import RaiseFactoryFacetABI from "../contracts/RaiseFactoryFacet.abi";
import { useExternalContractLoader, useContractReader, useBalance } from "../hooks";

import { useParams } from "react-router-dom";
import { create as createIPFSClient } from 'ipfs-http-client';
import RaiseFactoryFacetAddress from "../contracts/RaiseFactoryFacet.address";
import RaiseFactoryFacetAbi from "../contracts/RaiseFactoryFacet.abi";
import OneToOnePricingAbi from "../contracts/OneToOnePricing.abi";
import RaiseAbi from "../contracts/Raise.abi";
import { createSetAccessor } from "typescript";
import ReactMarkdown from 'react-markdown'
const ipfsClient = createIPFSClient('https://ipfs.infura.io:5001')
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;



export default function RaiseUI(props) {//props{match.params, provider, userSigner, address, tx}
  const { provider, userSigner, address, tx, injectedProvider } = props;
  const { raiseAddress } = useParams();
  const [loading, setLoading] = React.useState(false);
  const [loadedData, setLoadedData] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const [writeLoading, setWriteLoading] = React.useState(false);
  const [ethToSpend, setEthToSpend] = React.useState("0.1");
  const [toReceive, setToReceive] = React.useState("0");

  console.log(`loaded address ${raiseAddress}`);
  //step 2 create raise instance
  const raiseInstance = useExternalContractLoader(props.provider, raiseAddress, RaiseAbi);
  //step 3 use instance to get data
  const raiseData = useContractReader({ Raise: raiseInstance }, "Raise", "data", []);
  const raiseName = useContractReader({ Raise: raiseInstance }, "Raise", "name", []);
  const raiseSymbol = useContractReader({ Raise: raiseInstance }, "Raise", "symbol", []);
  const raiseEnd = useContractReader({ Raise: raiseInstance }, "Raise", "endTime", []);
  const totalRaised = useContractReader({ Raise: raiseInstance }, "Raise", "totalRaised", []);
  const okToApe = useContractReader({ Raise: raiseInstance }, "Raise", "okToApe", [address]);
  const totalSupply = useContractReader({ Raise: raiseInstance }, "Raise", "totalSupply", []);
  const pricingContractAddress = useContractReader({ Raise: raiseInstance }, "Raise", "pricing", []);
  console.log(`pricing contract address ${pricingContractAddress}`)
  console.log(`ok to ape ${okToApe}`);

  const pricingInstance = useExternalContractLoader(props.provider, pricingContractAddress, OneToOnePricingAbi);
  let maxRaise;
  console.log(pricingContractAddress);
  if (raiseData) {
    maxRaise = raiseData[1]
    document.title = raiseName;
  }
  console.log(`raise data ${pricingContractAddress} pricing contract address ${totalRaised} totalRaised ${maxRaise} maxRaise`);
  console.log(raiseData);
  if (raiseData) {
    console.log(`transferTax ${parseInt(BigInt(raiseData[5]))}`);
  }

  async function loadRaiseData() {
    setLoading(true);
    try {

      var d = await axios.get(raiseData[2]);
      console.log(`axios got data`);
      console.log(d);
      setLoadedData(d.data);
    } catch (e) {
      console.log(e);
    }
    setLoading(false);
  }

  React.useEffect(() => {
    if (raiseData != undefined && !loading) {
      loadRaiseData();
    }

    if (parseFloat(ethToSpend) && pricingInstance) {
      updateToReceive();
    }
  }, [raiseData, ethToSpend]);

  async function updateToReceive() {
    setToReceive(await pricingInstance.viewNextPrice(parseEther(ethToSpend != "" ? ethToSpend : "0"), totalSupply));
  }


  function isOpen(raiseData, raiseEnd) {
    if (raiseData && raiseEnd) {
      const r = relationToNow(raiseData[4], raiseEnd);
      if (r.includes("Closing in")) {
        return true;
      } else {
        return false;
      }
    }
    return false;
  }


  async function handleInvest() {
    setWriteLoading(true);
    const data = raiseInstance.interface.encodeFunctionData("apeIn", []);

    /* replace with
      pricingStrategy address */
    tx(

      userSigner.sendTransaction({
        to: raiseAddress,
        data: data,
        value: parseEther(ethToSpend),
      }),
    );
    setTimeout(() => {
      setVisible(false);
      setWriteLoading(false);
    }, 2000);
  };

  const handleCancel = () => {
    console.log('Clicked cancel button');
    setVisible(false);
  };

  function showHasTax() {
    if (raiseData) {
      if (parseInt(BigInt(raiseData[5])) > 0) {
        return <>**This token applies a <b>{parseInt(BigInt(raiseData[5]))/10000}% additive tax</b> on transfers **</>
      }
      return <></>
    } else {
      return <></>
    }
  }


  const backgroundColor = "lightgrey"
  const color = "black";
  return (
    <Layout style={{ height: window.height }}>
      <Sider style={{ backgroundColor: backgroundColor }}>
        <Image src={loadedData.image} style={{ width: "100%", height: "auto" }} />
        <br />

        <p style={{ color: color }}><b> {raiseSymbol ? `$${raiseSymbol.toUpperCase()}` : ""}</b></p>
      </Sider>
      <Layout>
        <Header style={{ backgroundColor: backgroundColor }}>
          <h1 style={{ color: color, fontSize: "x-large" }}>{raiseName ? raiseName : <Spin />}</h1>
          <br />
        </Header>
        <Content>
          <ReactMarkdown>
            {loadedData.description ? loadedData.description : <Spin />}</ReactMarkdown>
        </Content>
        <Footer>
          <hr />
          {showHasTax()}
          <br/>
          {isOpen(raiseData, raiseEnd) || okToApe ?
            (injectedProvider ?
              
              <Button onClick={() => setVisible(true)} size={"large"} style={{ backgroundColor: backgroundColor, color: color }}>Invest</Button> : <>Connect Your Wallet</>)
            : (raiseData ? <b><RelationToNow raiseStart={raiseData[4]} raiseEnd={raiseEnd} /> </b> : "")
          }
          <a href={`https://etherscan.io/address/${raiseAddress}`}> <Hint hint={<>{truncateString(`${raiseAddress}`, 8)}</>} /></a>
          <Modal
            title={`Join ${raiseName}`}
            visible={visible}
            onOk={handleInvest}
            confirmLoading={writeLoading}
            onCancel={handleCancel}
            cancelText={"Close"}
            okText={userSigner ? "Invest" : "Connect Wallet"}
          >
            <h3>Enter the amount of ETH to invest</h3>
            <EtherInput value={ethToSpend} onChange={e => setEthToSpend(e)} />
            <br /><br />
            <Row style={{ justifyContent: "space-between", width: "100%" }}>
              <span>You will receive: </span>
              <b>{formatEther(toReceive ? toReceive : "0")} ${raiseSymbol ? raiseSymbol.toUpperCase() : ""}</b>
            </Row>
          </Modal>
        </Footer>
      </Layout>
    </Layout>
  );
}
