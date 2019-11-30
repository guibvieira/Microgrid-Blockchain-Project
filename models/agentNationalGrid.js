//Using ganache
//const web3 = require('../test/Agent.test.js'); //ganache instance
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3 ( new Web3.providers.HttpProvider("http://localhost:8545"));


//compiled contracts
const exchange = require('../ethereum/exchange');


class AgentNationalGrid{
    constructor(){
        this.nationalGridPrice = 0.1437;
        this.purchaseHistory = [];
        this.balanceHistory = [];
    }

    async getAccount(index) {
        let accounts = await web3.eth.getAccounts();
        this.ethereumAddress = accounts[index];
        return this.ethereumAddress;
    }

    async getAgentBalance() {
        try{
            let balance = await web3.eth.getBalance(this.ethereumAddress);
            this.balance = balance;
            this.balanceHistory.push(balance);
            return balance;
        }catch(err){
            console.log('error from getting agent balance from national grid', err);
        }
       
    }
}

module.exports = AgentNationalGrid;