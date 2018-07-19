// import web3 from './web3';
// import HouseholdFactory from './build/HouseholdFactory.json';
// const ganache = require('ganache-cli');
// const Web3 = require('web3');
// const web3 = new Web3(ganache.provider());
const web3 = require('./web3-ganache');
const HouseholdFactory = require('./build/HouseholdFactory.json');
// const deploy = require('./deploy.js');

//replace this address with the deployed version of batteryfactory
const instance = new web3.eth.Contract(
    JSON.parse(HouseholdFactory.interface),
    '0x40780EcD703637e03d4C305F15e5539E7A65982F'
);

// export default instance;
module.exports = instance;