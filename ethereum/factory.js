//using infura
// const web3 = require('./web3');
// const HouseholdFactory = require ('./build/HouseholdFactory.json');

//Using ganache
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3( new Web3.providers.HttpProvider("http://localhost:8545"));
const HouseholdFactory = require('./build/HouseholdFactory.json');

//replace this address with the deployed version of householdFactory
const instance = new web3.eth.Contract(
    JSON.parse(HouseholdFactory.interface),
    '0xD91F0c0bd44f783f1bd90dE973266DFC9A2639f1'
);

// export default instance;
module.exports = instance;