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
    '0x3A839A2AD924cD1A24B6B086c8AEc96fC2621Cdd'
);

// export default instance;
module.exports = instance;