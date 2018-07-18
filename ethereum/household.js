const web3 =require('./web3-ganache');
const Household = require('./build/Household.json');

export default (address) => {
    return new web3.eth.Contract(
        JSON.parse(Household.interface),
        address
    );
};