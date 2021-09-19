
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
  Tooltip
} from "antd";
import { Address, Balance, EtherInput, AddressInput, Hint } from "../components";
import { parseEther, formatEther } from "@ethersproject/units";
import { Alert } from "antd";
import { ipfs, ipfsLinkFromHash } from "../helpers";
import RaiseFactoryFacetABI from "../contracts/RaiseFactoryFacet.abi";
import { useExternalContractLoader, useContractReader, useBalance } from "../hooks";

import { create as createIPFSClient } from 'ipfs-http-client';
import RaiseFactoryFacetAddress from "../contracts/RaiseFactoryFacet.address";
import RaiseFactoryFacetAbi from "../contracts/RaiseFactoryFacet.abi";
import OneToOnePricingAddress from "../contracts/OneToOnePricing.address";
import GrowingPricingAddress from "../contracts/GrowingPricing.address";
import WhitelistAddress from "../contracts/Whitelist.address";
import { InfoCircleOutlined } from "@ant-design/icons";

const pricingAddresses = [{
  name: "Flat Rate(1:1)",
  address: OneToOnePricingAddress
}, {
  name: "Increasing (starts 1:1 and price matches total sold)",
  address: GrowingPricingAddress
}
];
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
  const [amount, setAmount] = useState();
  const [customPricingStrategyAddress, setCustomPricingStrategyAddress] = useState(pricingAddresses[0].address);
  const [whitelistAddress, setWhitelistAddress] = useState(WhitelistAddress);
  const [pricingStrategy, setPricingStrategy] = useState();
  const [symbol, setSymbol] = useState();
  const [name, setName] = useState();
  const [maxSupply, setMaxSupply] = useState(0);
  const [bufferedFile, setBufferedFile] = useState();
  const [fundingRange, setFundingRange] = useState();
  const [selfMint, setSelfMint] = useState(0);
  const [maxBuy, setMaxBuy] = useState(0);
  const [transactionTax, setTransactionTax] = useState(0);
  const [decimals, setDescimals] = useState(18);
  const [advancedTokenomics, setAdvancedTokenomics] = useState();
  const [description, setDescription] = useState(`
  Add a short description to show on the home page preview (max 20 characters)

  # RAISEHOUSE
  ## _No Liquidity Loans, Today_
  
  [![N|Solid](https://i.imgur.com/brS2OOU.png)](https://ethereum.org)

  RAISEHOUSE is a decentralized, zero-liquidity, non-security, fundraising platform.
  
  - Totally onchain
  - Simple, easy, and no coding required
  - ✨Magic  Undercollateralized Loans ✨
  
  ## Features
  
  - Use your social presence to fundraise your prerevenue projects
  - This simple markdown description is totally customizable
  - Customize your token and get a custom link for your limited time raise
  - Let us provide the launch platform so you can focus on buidling 
  
  Markdown is a lightweight markup language based on the formatting conventions
  that people naturally use in email. This description is shown on your raise page. Customize it to show people why they should invest in you.
  
  As [Satoshi Nakamoto](https://bitcoin.org/bitcoin.pdf) writes 
  
  >  A  purely   peer-to-peer   version   of   electronic   cash   would   allow   online 
  payments   to   be   sent   directly   from   one   party   to   another   without   going   through   a 
  financial institution
  
  RAISEHOUSE's goal is to bring that vision to fundraising, no more initial offering gatekeepers.
  `);

  const [loading, setLoading] = useState();
  const instance = useExternalContractLoader(mainnetProvider, RaiseFactoryFacetAddress, RaiseFactoryFacetAbi);


  const data = {}; //writeContracts.DeFiFacet.interface.encodeFunctionData("zappify", [parseEther("1000")]);
  console.log(userSigner);
  const uploadProps = {
    listType: "picture",
    action: "#",
    onChange(e) {
      setBufferedFile(e.file.thumbUrl);
      console.log("buffer", e.file.thumbUrl);
    },
    defaultFileList: [],
  };

  function handlePricingChange(v) {
    console.log(v);
    setPricingStrategy(v);
    setCustomPricingStrategyAddress(v);
  }

  function handleRangeDateChange(e) {
    setFundingRange(e);
  }

  function handleTokenCreation() {
    setLoading(true);
    if (bufferedFile != undefined) {
      createTokenURI(bufferedFile)
      /*   ipfs.files.add(Buffer.from(bufferedFile), (error, result) => {
          if (result) {
            createTokenURI(ipfsLinkFromHash(result[0].hash));
          } else {
            console.log(error);
          }
          setLoading(false); 
        });*/
    } else {
      createTokenURI("");
    }
  }

  async function createTokenURI(logoURL) {
    var tokenURI = await ipfsClient.add(JSON.stringify({ image: logoURL, name, description }));
    createFundingRequest(ipfsLinkFromHash(tokenURI.path));
  }

  function createFundingRequest(tokenURI) {
    setLoading(true);
    if (!fundingRange) {
      alert("Funding Range is a required input, please select a date range for your funding event");
    } else if (!name) {
      alert("Name is a required input");
    } else if (!symbol) {
      alert("Symbol is a required input");
    } else {
      console.log(`creating fr with logo ${tokenURI}`);
      let start = fundingRange[0]._d.getTime() / 1000;
      let end = fundingRange[1]._d.getTime() / 1000;
      start = Math.floor(start);
      end = Math.floor(end);
      const eventLength = end - start;

      console.log(`using pricing strategy ${customPricingStrategyAddress}`);

      console.log(`start ${start}, end ${end}`);
      const data = instance.interface.encodeFunctionData("createFR", [
        transactionTax,
        /*  decimals, */
        parseEther(`${selfMint}`),
        parseEther(`${maxSupply}`),
        tokenURI,
        eventLength,
        start,
        name,
        symbol,
        customPricingStrategyAddress,
        whitelistAddress,
        maxBuy
      ]);

      /* replace with
        pricingStrategy address */
      tx(

        userSigner.sendTransaction({
          to: RaiseFactoryFacetAddress,
          data: data,
          value: 0,
        }),
      );
    }

    setLoading(false);
  }

  return (
    <div>
      {/*
        ⚙️ Here is an example UI that displays and sets the purpose in your smart contract:
      */}
      <Alert
        message={"⚠️ Test your settings out on rinkeby testnet here[https://weary-list.surge.sh/] before deploying to production to avoid any unexpected suprises"}
        description={<div></div>}
        type="error"
        closable={false}
      />
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
        <h2>Create Your Token</h2>
        <br />
        {/* <h4>purpose: {purpose}</h4> */}
        {/* upgrades the defi facet only currently for demo purposes */}
        <Divider />
        <div style={{ margin: 8 }}>
          <h5>
            Token Name
            <Required />
          </h5>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Token Name" />
          <br />
          <br />

          <h5>
            Token Symbol
            <Required />
          </h5>
          <Input value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="Token Symbol" />
          <br /><br />
          <Switch checkedChildren="Advanced Tokenomics Enabled" unCheckedChildren="Show Advanced Tokenomics" onChange={v => setAdvancedTokenomics(v)} />
          <br /> <br />
          {
            advancedTokenomics ?
              <div style={{ border: "1px solid #bada55", padding: "5px" }}>
                <br />
                <h3>Advanced Tokenomics </h3>
                <br />
                <h5>
                  Max Supply
                </h5>
                <Hint hint={<>Leave blank for uncapped sale</>} />
                <InputNumber
                  style={{ width: "100%" }}
                  min="0"
                  step="1"
                  parser={value => value.replace(/\$\s?|(,*)/g, "")}
                  onChange={e => setMaxSupply(e)}
                  value={maxSupply}
                  stringMode
                />
                {/* <br />
                <br />
                <br />
                <h5>
                  Decimals
                </h5>
                <Hint hint={<>If unsure leave as 18, thats standard</>} />
                <InputNumber
                  style={{ width: "100%" }}
                  min="0"
                  step="1"
                  parser={value => value.replace(/\$\s?|(,*)/g, "")}
                  onChange={e => setDescimals(e)}
                  value={decimals}
                  stringMode
                /> */}
                <br />
                <br />
                <h5>
                  Self Mint
                </h5>
                <Hint hint={<>How many tokens to premint for you? (without decimals). If you self mint tokens then 0.1% of the amount you mint extra will be minted for the maintainers of RaiseHouse</>} />
                <InputNumber
                  style={{ width: "100%" }}
                  min="0"
                  step="1"
                  parser={value => value.replace(/\$\s?|(,*)/g, "")}
                  onChange={e => setSelfMint(e)}
                  value={selfMint}
                  stringMode
                />
                <br />
                <br />
                <h5>
                  Max Buy Per Address
                </h5>
                <Hint hint={<>How many tokens can any one address buy in total from the raise (expressed in tokens wei, not in ETH)?</>} />
                <Hint hint={<>Leave as zero(0) for no cap on how much any one address can invest</>}/>
                <InputNumber
                  style={{ width: "100%" }}
                  min="0"
                  step="1"
                  parser={value => value.replace(/\$\s?|(,*)/g, "")}
                  onChange={e => setMaxBuy(e)}
                  value={maxBuy}
                  stringMode
                />

                <br />
                <br />
                <h5>
                  Transaction Tax
                </h5>
                <Hint hint={<>⚠️Transaction tax is not recommended and only intended for advanced users⚠️</>} />
                <Hint hint={<>Enter value in bips such that amountAfterTax = (amount * TAXAMOUNT) / 10000</>} />
                <Hint hint={<>Example: for a 5% tax enter 500</>} />
                <Hint hint={<>We really recommend you dont add a Tax, it will make it harder to add your token DEXs like Uni or Sushiswap</>} />
                <InputNumber
                  style={{ width: "100%" }}
                  min="0"
                  step="1"
                  parser={value => value.replace(/\$\s?|(,*)/g, "")}
                  onChange={e => setTransactionTax(e)}
                  value={transactionTax}
                  stringMode
                />

                <br />
                <br />
                <h5>
                  Whitelist Address
                </h5>
                <Hint hint={<>address of a contract implementing IWhitelist (leave as default for a empty whitelist). Note that stARBIS holders are automatically on the whitelist. The whitelists only function is to allow people to buy into your raise before the offical opening time.</>} />
                <AddressInput
                autoFocus
                ensProvider={mainnetProvider}
                placeholder="Custom Whitelist Address"
                value={whitelistAddress}
                onChange={setWhitelistAddress}
              />
              </div>
              : <></>
          }

          <br />
          <br />
          <h5>
            Launch Date Range 
            <Required /> <Tooltip title="Holders of $RAISE will be able to mint before the launch starts but only you will be able to transfer tokens. Expressed in UTC"><InfoCircleOutlined /></Tooltip>
          </h5>
          <Hint hint={<>(How Long Can Investors Join This Fundraiser?)</>} />
          <RangePicker showTime={{ format: "HH:mm" }} format="YYYY-MM-DD HH:mm" onChange={(e) => handleRangeDateChange(e)} onOk={() => { }} />

          <br />
          <br />
          <h5>
            Select Pricing Model
            <Required />
            <Tooltip title="This sets the relationship between how much of your token people get based on the amount of ETH they send. If you don't see a model you like ask in the support discord for assistance in creating a new one"><InfoCircleOutlined /></Tooltip>
          </h5>
          <Select defaultValue={pricingAddresses[0].address} style={{ width: "100%" }} onChange={handlePricingChange}>
            {pricingAddresses.map(p => {
              return <Option value={p.address}>{p.name}</Option>
            })}
            <Option value="disabled" disabled>
              More Coming Soon
            </Option>
            <Option value="0x0000000000000000000000000000000000000000">Custom</Option>
          </Select>


          <br />
          {pricingStrategy == "0x0000000000000000000000000000000000000000" ? (
            <>
              <AddressInput
                autoFocus
                ensProvider={mainnetProvider}
                placeholder="Custom Pricing Strategy Address"
                value={customPricingStrategyAddress}
                onChange={setCustomPricingStrategyAddress}
              />
              <Hint hint={<>Enter address of a custom contract inheriting to the <a href='#'>IPricing</a> interface</>} />

            </>
          ) : (
            <></>
          )}

          <br />
          <br />

          <h5>Logo <Tooltip title="Works best with a 400x400 jpeg"><InfoCircleOutlined /></Tooltip></h5>

          <input
            type="file"
            onChange={async (e) => {
              const file = e.target.files[0]
              try {
                const added = await ipfsClient.add(file)
                const url = `https://ipfs.infura.io/ipfs/${added.path}`
                setBufferedFile(url)
              } catch (error) {
                console.log('Error uploading file: ', error)
              }
            }}
          />
          <br />
          <br />

          <h5>Description</h5>
          <p style={{ fontSize: "xx-small" }}>(Markdown Friendly)</p>

          <TextArea
            placeholder="Description of your project, fundraising goals, and why investors should trust that they'll profit"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
        <Divider />
        {loading ? (
          <div style={{ marginTop: 32 }}>
            <Spin />
          </div>
        ) : (
          <Button onClick={() => handleTokenCreation()}>Create Token</Button>
        )}
      </div>
    
    </div>
  );
}
