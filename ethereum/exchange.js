//Using infura, uncomment lines under ganache method for it to work
//const web3 = require('./web3.js');

const web3 = require('./web3');
const Exchange = require ('./build/Exchange.json');

//replace this address with the deployed version of exchange
const instance = new web3.eth.Contract(
    JSON.parse(Exchange.interface),
    '0x0f169036A1EA08Fa76C7680dAc7d90F96DFB26f7'
);

// export default instance;
module.exports = instance;