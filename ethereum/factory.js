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
    '0x2effD7F856e4d1459f39aceAa2f2F3d2e7A3E7A1'
);

// export default instance;
module.exports = instance;