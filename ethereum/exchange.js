//Using infura, uncomment lines under ganache method for it to work
//const web3 = require('./web3.js');

//Using ganache
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
const Exchange = require ('./build/Exchange.json');

//replace this address with the deployed version of exchange
const instance = new web3.eth.Contract(
    JSON.parse(Exchange.interface),
<<<<<<< HEAD
    '0x280925210865E34d1b900EfeE8C6f342ed887097'
=======
    '0x6e36C4A5c39A4FC7335beDF8efaDD3fe3Addb5FC'
>>>>>>> agentNationalGrid
);

// export default instance;
module.exports = instance;