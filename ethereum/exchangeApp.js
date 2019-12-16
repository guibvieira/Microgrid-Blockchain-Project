//Using infura, uncomment lines under ganache method for it to work
const web3 = require('./web3.js');
const Exchange = require ('./build/Exchange.json');

//replace this address with the deployed version of exchange
const instance = new web3.eth.Contract(
    JSON.parse(Exchange.interface),
    '0x04a1b47BA8A59491eB1A22001b93729B69411180'
);

// export default instance;
module.exports = instance;