# 🎨NFT Book

ERC721 Rental system implemented in EIP 2535 Diamond Standard

## Quickstart
refer to the [scaffold-eth](https://github.com/austintgriffith/scaffold-eth) quickstart guide for full details.

In short: 
run `npm install`or `yarn`  in this dir. run it again in `pacakges/hardhat` and `packages/react-app`.

after that put a mnemonic file like the `packages/hardhat/menomic.example.txt` called `mnemonic.txt`. 

run `yarn deploy` from this folder.

run `yarn start` from this folder.

once you have the app running here is a rinkeby example link: 
`http://localhost:3000/view?nft=0x05406368183a1681247e6853a9a89b66f2bf637f&id=2` to view NFT booking page. It will not work unless the NFT you are trying to view is deployed on the network you want to connect to.


## Todos
These are things that would be good to tidy things up and make it better ux

 - add a explore page using booking creation events to find them
 - update the BookingUI provider for read calls to public mainnet (so data can be displayed without having to connect wallet) 
 - add a share link
