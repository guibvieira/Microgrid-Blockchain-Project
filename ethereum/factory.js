import web3 from './web3';
import HouseholdFactory from './build/HouseholdFactory.json';

//replace this address with the deployed version of batteryfactory
const instance = new web3.eth.Contract(
    JSON.parse(HouseholdFactory.interface),
    '0xFf467239dD8066f81d0E5815Ab69E7Ee3de7aC3c'
);

export default instance;