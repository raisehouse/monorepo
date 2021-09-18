const fs = require("fs");
const chalk = require("chalk");
const { config, ethers } = require("hardhat");
const { utils } = require("ethers");
const R = require("ramda");


const main = async () => {

  console.log("\n\n 📡 Deploying...\n");

  const FacetCutAction = {
    Add: 0,
    Replace: 1,
    Remove: 2
  }

  function getSelectors (contract) {
    console.log(`reducing contract ${contract}`);
    const signatures = Object.keys(contract.interface.functions)
   console.log(signatures.length);
   console.log(signatures);
    const selectors = [];
    for (var i in signatures) {
      console.log(`i is ${i}`);
    console.log(contract.interface.getSighash(signatures[i]));
      selectors.push(contract.interface.getSighash(signatures[i]));
    }

    console.log(selectors);
    return selectors 
  }

  const raiseFactoryFacet = await deploy("RaiseFactoryFacet") // <-- dia in constructor args like line 19 vvvv
  const diamondCutFacet = await deploy("DiamondCutFacet") // <-- add in constructor args like line 19 vvvv
 //const govToken = await deploy("Benies", ["BENIES", "LTG"]) // <-- add in constructor args like line 19 vvvv
 const oneToOnePricing = await deploy("OneToOnePricing");
 const growingPricing = await deploy("GrowingPricing");
 const defaultWhitelist = await deploy("Whitelist");
 // initial version of the defi and diamond cut facet after deploying the initial version of these contracts feel free to comment line 37 - 40 and line 34 and make changes to the defi facet contract and deploy alone and upgrade the diamond through ui
 // diamonf cut params include facet address, action and function signatures
 /* async function deployFacets (...facets) {
  const instances = []
  for (let facet of facets) {
    let constructorArgs = []
    if (Array.isArray(facet)) {
      ;[facet, constructorArgs] = facet
    }
    const factory = await ethers.getContractFactory(facet)
    const facetInstance = await factory.deploy(...constructorArgs)
    await facetInstance.deployed()

    const tx = facetInstance.deployTransaction
    const receipt = await tx.wait()
    instances.push(facetInstance)
  }
  return instances
} */
async function deployFacets (...facets) {
  const instances = []
  for (let facet of facets) {
    let constructorArgs = []
    if (Array.isArray(facet)) {
      ;[facet, constructorArgs] = facet
    }
    const factory = await ethers.getContractFactory(facet)
    const facetInstance = await factory.deploy(...constructorArgs)
    await facetInstance.deployed()

    const tx = facetInstance.deployTransaction
    const receipt = await tx.wait()
    instances.push(facetInstance)
  }
  return instances
}
 let [
  RaiseFactoryFacet,
] = await deployFacets(
  'contracts/RaiseFactoryFacet.sol:RaiseFactoryFacet',
  
)

function getSignatures (contract) {
  return Object.keys(contract.interface.functions)
}

async function deployDiamond ({
  diamondName,
  initDiamond,
  facets,
  owner,
  args = []
}) {
  if (arguments.length !== 1) {
    throw Error(`Requires only 1 map argument. ${arguments.length} arguments used.`)
  }
  //facets = await deployFacets(facets)
  const diamondFactory = await ethers.getContractFactory('Diamond')
  const diamondCut = []
  console.log('--')
  console.log('Setting up diamondCut args')
  console.log('--')
  for (const [name, deployedFacet] of facets) {
    console.log(name)
    console.log(getSignatures(deployedFacet))
    console.log('--')
    diamondCut.push([
      deployedFacet.address,
      FacetCutAction.Add,
      getSelectors(deployedFacet)
    ])
  }
  console.log('--')
  //console.log(diamondCut)


  let result
  if (typeof initDiamond === 'string') {
    const initDiamondName = initDiamond
    console.log(`Deploying ${initDiamondName}`)
    initDiamond = await ethers.getContractFactory(initDiamond)
    initDiamond = await initDiamond.deploy()
    await initDiamond.deployed()
    result = await initDiamond.deployTransaction.wait()
    if (!result.status) {
      throw (Error(`Deploying ${initDiamondName} TRANSACTION FAILED!!! -------------------------------------------`))
    }
  }

  //console.log('Encoding diamondCut init function call')
  const functionCall = initDiamond.interface.encodeFunctionData('init', args)
   //let functionCall
   //if (args.length > 0) {
   //  functionCall = initDiamond.interface.encodeFunctionData("init", ...args)
   //} else {
   //  functionCall = initDiamond.interface.encodeFunctionData()
   //}

  console.log(`Deploying ${diamondName}`)

  const deployedDiamond = await diamondFactory.deploy(owner)  
  await deployedDiamond.deployed()
    
  result = await deployedDiamond.deployTransaction.wait()
  if (!result.status) {
    console.log('Deploying diamond TRANSACTION FAILED!!! -------------------------------------------')
    console.log('See block explorer app for details.')
    console.log('Transaction hash:' + deployedDiamond.deployTransaction.hash)
    throw (Error('failed to deploy diamond'))
  }
  console.log('Diamond deploy transaction hash:' + deployedDiamond.deployTransaction.hash)

  console.log(`${diamondName} deployed: ${deployedDiamond.address}`)
  console.log(`Diamond owner: ${owner}`)

  const diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', deployedDiamond.address)
  
  const tx = await diamondCutFacet.diamondCut(diamondCut, initDiamond.address, functionCall)

  // console.log(`${diamondName} diamondCut arguments:`)
  // console.log(JSON.stringify([facets, initDiamond.address, args], null, 4))
  result = await tx.wait()
  if (!result.status) {
    console.log('TRANSACTION FAILED!!! -------------------------------------------')
    console.log('See block explorer app for details.')
  }
  console.log('DiamondCut success!')
  console.log('Transaction hash:' + tx.hash)
  console.log('--')
  return deployedDiamond
}


const accounts = await ethers.getSigners()
const ownerAddress = await accounts[0].getAddress()

//console.log(`gov token is ${govToken}`);
//console.log(govToken.address);

let raiseHouseDiamond = await deployDiamond({
  diamondName: 'RaiseHouseDiamond',
  initDiamond: 'contracts/InitDiamond.sol:InitDiamond',
  owner: ownerAddress,
  facets: [
    ['RaiseFactoryFacet', raiseFactoryFacet],
  ],
  args: [["0x0000000000000000000000000000000000000000"]]
})
 
 /* const diamondCutParams = [
    [diamondCutFacet.address, FacetCutAction.Add, [ '0x1f931c1c' ]],
    [bookingFactoryFacet.address, FacetCutAction.Add, []]
  ]
  // eslint-disable-next-line no-unused-vars
  const deployedDiamond = await deploy("Diamond", [diamondCutParams])  */
}

  //const secondContract = await deploy("SecondContract")

  // const exampleToken = await deploy("ExampleToken")
  // const examplePriceOracle = await deploy("ExamplePriceOracle")
  // const smartContractWallet = await deploy("SmartContractWallet",[exampleToken.address,examplePriceOracle.address])



  /*
  //If you want to send value to an address from the deployer
  const deployerWallet = ethers.provider.getSigner()
  await deployerWallet.sendTransaction({
    to: "0x34aA3F359A9D614239015126635CE7732c18fDF3",
    value: ethers.utils.parseEther("0.001")
  })
  */


  /*
  //If you want to send some ETH to a contract on deploy (make your constructor payable!)
  const yourContract = await deploy("YourContract", [], {
  value: ethers.utils.parseEther("0.05")
  });
  */


  /*
  //If you want to link a library into your contract:
  // reference: https://github.com/austintgriffith/scaffold-eth/blob/using-libraries-example/packages/hardhat/scripts/deploy.js#L19
  const yourContract = await deploy("YourContract", [], {}, {
   LibraryName: **LibraryAddress**
  });
  */


  console.log(
    " 💾  Artifacts (address, abi, and args) saved to: ",
    chalk.blue("packages/hardhat/artifacts/"),
    "\n\n"
  );

const deploy = async (contractName, _args = [], overrides = {}, libraries = {}) => {
  console.log(` 🛰  Deploying: ${contractName}`);

  const contractArgs = _args || [];
  const contractArtifacts = await ethers.getContractFactory(contractName,{libraries: libraries});
  const deployed = await contractArtifacts.deploy(...contractArgs, overrides);
  const encoded = abiEncodeArgs(deployed, contractArgs);
  fs.writeFileSync(`artifacts/${contractName}.address`, deployed.address);

  console.log(
    " 📄",
    chalk.cyan(contractName),
    "deployed to:",
    chalk.magenta(deployed.address),
  );

  if (!encoded || encoded.length <= 2) return deployed;
  fs.writeFileSync(`artifacts/${contractName}.args`, encoded.slice(2));

  return deployed;
};


// ------ utils -------

// abi encodes contract arguments
// useful when you want to manually verify the contracts
// for example, on Etherscan
const abiEncodeArgs = (deployed, contractArgs) => {
  // not writing abi encoded args if this does not pass
  if (
    !contractArgs ||
    !deployed ||
    !R.hasPath(["interface", "deploy"], deployed)
  ) {
    return "";
  }
  const encoded = utils.defaultAbiCoder.encode(
    deployed.interface.deploy.inputs,
    contractArgs
  );
  return encoded;
};

// checks if it is a Solidity file
const isSolidity = (fileName) =>
  fileName.indexOf(".sol") >= 0 && fileName.indexOf(".swp") < 0 && fileName.indexOf(".swap") < 0;

const readArgsFile = (contractName) => {
  let args = [];
  try {
    const argsFile = `./contracts/${contractName}.args`;
    if (!fs.existsSync(argsFile)) return args;
    args = JSON.parse(fs.readFileSync(argsFile));
  } catch (e) {
    console.log(e);
  }
  return args;
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });