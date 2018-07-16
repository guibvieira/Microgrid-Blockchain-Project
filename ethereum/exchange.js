// import web3 from './web3';
// import HouseholdFactory from './build/HouseholdFactory.json';
const web3 = require('./web3');
const HouseholdFactory = require ('./build/HouseholdFactory.json');

//replace this address with the deployed version of batteryfactory
const instance = new web3.eth.Contract(
    JSON.parse(HouseholdFactory.interface),
    '0xC9963422D23d757592FFB3b0786E3affbc068f93'
);

// export default instance;
module.exports = instance;