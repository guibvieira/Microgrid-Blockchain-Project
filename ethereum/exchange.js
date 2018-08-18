//Using infura, uncomment lines under ganache method for it to work
//const web3 = require('./web3.js');

//Using ganache
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3( new Web3.providers.HttpProvider("http://localhost:8545"));
const Exchange = require ('./build/Exchange.json');

//replace this address with the deployed version of exchange
const instance = new web3.eth.Contract(
    JSON.parse(Exchange.interface),
    '0x3b7168b0AEE1029Ce9f91bCC0D76af413EAF292E'
);

// export default instance;
module.exports = instance;