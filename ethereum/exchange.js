//Using infura, uncomment lines under ganache method for it to work
//const web3 = require('./web3.js');

const web3 = require('./web3');
const Exchange = require ('./build/Exchange.json');

//replace this address with the deployed version of exchange
const instance = new web3.eth.Contract(
    JSON.parse(Exchange.interface),
    '0x8Fd05c935E180e8226795077cF642fB12d4AD74e'
);

// export default instance;
module.exports = instance;