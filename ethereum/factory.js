//using infura
// const web3 = require('./web3');
// const HouseholdFactory = require ('./build/HouseholdFactory.json');

const readCSV = require('../utils/readFile');
const inputFile = 'deployedAddresses.csv';
//Using ganache
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
const HouseholdFactory = require('./build/HouseholdFactory.json');
async function initHouseholdFactory() {
    async function loadData(inputFile) {
        let resultSet = await readCSV(inputFile);
        return resultSet[1][1]; //return factory address only
    }
    let householdFactoryContract = await loadData(inputFile);
    //replace this address with the deployed version of householdFactory
    const instanceHouseholdFactory = new web3.eth.Contract(
        JSON.parse(HouseholdFactory.interface),
        `${householdFactoryContract}`
    );
    console.log('HouseholdContract contract instance created');
    return instanceHouseholdFactory;
}
module.exports = initHouseholdFactory; //cannot use await init() here to get instance value, due to not being wrapped inside async function
