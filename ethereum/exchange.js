// import web3 from './web3';
// import HouseholdFactory from './build/HouseholdFactory.json';
// const ganache = require('ganache-cli');
// const Web3 = require('web3');
// const web3 = new Web3(ganache.provider());

const web3 =require('./web3-ganache');
const Exchange = require ('./build/Exchange.json');

//replace this address with the deployed version of batteryfactory
const instance = new web3.eth.Contract(
    JSON.parse(Exchange.interface),
    '0x9a0AC7CAbA5D70Ef30e62F79cD5Ba4f1d1161FfF'
);

// export default instance;
module.exports = instance;