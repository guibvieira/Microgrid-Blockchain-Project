// import web3 from './web3';
// import HouseholdFactory from './build/HouseholdFactory.json';
// const ganache = require('ganache-cli');
// const Web3 = require('web3');
// const web3 = new Web3(ganache.provider());
const web3 = require('./web3');
const HouseholdFactory = require ('./build/HouseholdFactory.json');

//replace this address with the deployed version of batteryfactory
const instance = new web3.eth.Contract(
    JSON.parse(HouseholdFactory.interface),
    '0xaC463BDBB0eE04ce22C4478E5F279b253f2631F8'
);

// export default instance;
module.exports = instance;