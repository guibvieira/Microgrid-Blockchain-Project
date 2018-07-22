//Using infura, uncomment lines under ganache method for it to work
//const web3 = require('./web3.js');

//using ganache, comment these lines and import from web3.js file to use infura
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3( new Web3.providers.HttpProvider("http://localhost:8545"));

//factory compiled
const HouseholdFactory = require ('./build/HouseholdFactory.json');

//replace this address with the deployed version of householdFactory
const instance = new web3.eth.Contract(
    JSON.parse(HouseholdFactory.interface),
    '0x3D470A86D3211D2c508D8C942AD04993F7B6b923'
);

// export default instance;
module.exports = instance;