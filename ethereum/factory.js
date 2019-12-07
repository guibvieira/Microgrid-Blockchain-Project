//using infura
// const web3 = require('./web3');
// const HouseholdFactory = require ('./build/HouseholdFactory.json');

//Using ganache
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const HouseholdFactory = require('./build/HouseholdFactory.json');
//replace this address with the deployed version of householdFactory
const instance = new web3.eth.Contract(
    JSON.parse(HouseholdFactory.interface),
    '0xC6A096d0791DE5ccbFB0D36Eb2BB7F0e2bf9b88a'
);

// export default instance;
module.exports = instance;