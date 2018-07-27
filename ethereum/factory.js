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
    '0x3c3F7C78C9363241eB3E47414b72e21416395a39'
);

// export default instance;
module.exports = instance;