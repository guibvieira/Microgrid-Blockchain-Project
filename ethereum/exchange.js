//Using infura, uncomment lines under ganache method for it to work
//const web3 = require('./web3.js');

const readCSV = require('./../Simulation/readFile');
const inputFile = 'deployedAddresses.csv';

//Using ganache
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
const Exchange = require('./build/Exchange.json');

// module.exports = {
//     async getExchangeInstance() {
//         async function loadData(inputFile) {
//             let resultSet = await readCSV(inputFile);
//             return resultSet[1][0]; //return exchange address only
//         }
//         let householdExchange = await loadData(inputFile);


//         //replace this address with the deployed version of exchange
//         const instance = new web3.eth.Contract(
//             JSON.parse(Exchange.interface),
//             `${householdExchange}`
//         );
//         console.log('Exchange contract instance created');
//         return instance;
//         // export default instance;
//         // module.exports = instance;
//     }
// }

//replace this address with the deployed version of exchange
const instance = new web3.eth.Contract(
    JSON.parse(Exchange.interface),
    '0xfD449f7603452A85809Cf64524af699178a78fec'
);

// export default instance;
module.exports = instance;


