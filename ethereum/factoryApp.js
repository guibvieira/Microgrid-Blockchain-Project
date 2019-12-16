//using infura
const web3 = require('./web3');
const HouseholdFactory = require ('./build/HouseholdFactory.json');

//replace this address with the deployed version of householdFactory
const instance = new web3.eth.Contract(
    JSON.parse(HouseholdFactory.interface),
    '0x03e2c2e7C7B7363DC4c31cB73519032798BafdA2'
);

// export default instance;
module.exports = instance;