import web3 from './web3';
import Household from './build/Household.json';

export default (address) => {
    return new web3.eth.Contract(
        JSON.parse(Household.interface),
        address
    );
};