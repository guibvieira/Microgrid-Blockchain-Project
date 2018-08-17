//Using ganache
//const web3 = require('../test/Agent.test.js'); //ganache instance
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3 ( new Web3.providers.HttpProvider("http://localhost:8545"));


//compiled contracts
const exchange = require('../ethereum/exchange');


class AgentBiomass{
    constructor(){
        this.biomassPrice = 0.1437; //0.06 to 0.12
        this.tradingHistory = new Array();
        this.askHistory =  new Array();
        this.balanceHistory = new Array();
        this.generationData = new Array();
        this.timeRow = 0;
        this.biomassAddress = 0;
    }

    loadData(biomassData) {
        this.householdID = householdID;
        
        for (i = 0; i < biomassData.length-1; i++){

            let currentSupply = {
                time: i, 
                supply: + parseFloat(historicData[i]).toFixed(6)
            }
            
            this.generationData.push(currentSupply);
        }

        return true;
    }

    setCurrentTime(time) {
        this.timeRow = time;
    }

    async getAccount(index) {
        let accounts = await web3.eth.getAccounts();
        this.ethereumAddress = accounts[index];
        return this.ethereumAddress;
    }

    async getAgentBalance() {
        let balance = await web3.eth.getBalance(this.ethereumAddress);
        this.balance = balance;
        this.balanceHistory.push(balance);
        return balance;
    }

    async sellingLogic() {
        let price = await this.convertToWei(this.biomassPrice);
        await this.placeAsk(price, this.generationData[this.timeRow]);
    }

    async placeAsk(price, amount){
        let date = (new Date()).getTime();
        let transactionReceipt = await exchange.methods.placeAsk(price, amount, date).send({
            from: this.ethereumAddress,
            gas: '3000000'
        });
        let newAsk = {
            address: this.ethereumAddress,
            price: price,
            amount: amount,
            date: date,
            timeRow: this.timeRow,
            transactionCost: transactionReceipt.gasUsed
        }
        this.askHistory.push(newAsk);
        return true;
    }

    async convertToWei(price) {
        let calcPrice = (price / this.priceOfEther);
        calcPrice = calcPrice.toFixed(18);
        price = await web3.utils.toWei(calcPrice, 'ether');
        price = parseInt(price);
        return price;
    }
}

module.exports = AgentBiomass;