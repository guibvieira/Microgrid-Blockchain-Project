//Using infura, uncomment lines under ganache method for it to work
//const web3 = require('./web3.js');

const readCSV = require('../utils/readFile');
const inputFile = 'deployedAddresses.csv';
//Using ganache
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
const Exchange = require('./build/Exchange.json');

async function initExchange() {
    async function loadData(inputFile) {
        let resultSet = await readCSV(inputFile);
        return resultSet[1][0]; //return factory address only
    }
    let exchangeContract = await loadData(inputFile);
    //replace this address with the deployed version of householdFactory
    const instanceExchange = new web3.eth.Contract(
        JSON.parse(Exchange.interface),
        `${exchangeContract}`
    );

    console.log('Factory contract instance created');
    return instanceExchange;
}
module.exports = initExchange; //cannot use await init() here to get instance value, due to not being wrapped inside async function