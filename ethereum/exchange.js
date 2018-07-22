//Using infura, uncomment lines under ganache method for it to work
//const web3 = require('./web3.js');

//using ganache, comment these lines and import from web3.js file to use infura
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3( new Web3.providers.HttpProvider("http://localhost:8545"));

//Exchange compiled
const Exchange = require ('./build/Exchange.json');

//replace this address with the deployed version of exchange
const instance = new web3.eth.Contract(
    JSON.parse(Exchange.interface),
    '0x5232eb7c105AC7F00785cADe86eD8d6CB60F8544'
);

// export default instance;
module.exports = instance;