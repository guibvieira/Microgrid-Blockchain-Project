//using infura
// const web3 = require('./web3');
// const HouseholdFactory = require ('./build/HouseholdFactory.json');

const readCSV = require('./../Simulation/readFile');
const inputFile = 'deployedAddresses.csv';

//Using ganache
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
const HouseholdFactory = require('./build/HouseholdFactory.json');

// module.exports = {
//     async getFactoryInstance() {
//         async function loadData(inputFile) {
//             let resultSet = await readCSV(inputFile);
//             return resultSet[1][1]; //return factory address only
//         }
//         let householdFactory = await loadData(inputFile);

//         //replace this address with the deployed version of householdFactory
//         const instance = new web3.eth.Contract(
//             JSON.parse(HouseholdFactory.interface),
//             `${householdFactory}`
//         );
//         console.log('Factory contract instance created');
//         return instance;
//         // export default instance;
//         // module.export = instance;
//     }
// }

// init(); //cannot use await init() here to get instance value, due to not being wrapped inside async function


//replace this address with the deployed version of householdFactory
const instance = new web3.eth.Contract(
    JSON.parse(HouseholdFactory.interface),
    '0xEb0F4DA27B69DD13A6537626dF6d778763B954E0'
);

// export default instance;
module.exports = instance;