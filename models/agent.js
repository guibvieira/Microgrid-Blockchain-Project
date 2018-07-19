//const web3 = require('../ethereum/web3.js');

//Using Infura
// const HDWalletProvider = require('truffle-hdwallet-provider');
// const Web3 = require('web3');
// const provider = new HDWalletProvider('pulse stable fever half settle phone impact theory crater grit chef census',
//                                     'https://rinkeby.infura.io/YDnIBMV5OY1S3hf9iVWn'
// );
// const web3 = new Web3(provider);
// const compiledFactory = require('../ethereum/build/HouseholdFactory.json');
// const compiledHousehold = require('../ethereum/build/Household.json');
// const compiledExchange = require('../ethereum/build/Exchange.json');

//Using ganache
const web3 = require('../ethereum/web3-ganache.js'); //ganache instance
const compiledFactory = require('../ethereum/build/HouseholdFactory.json');
const compiledHousehold = require('../ethereum/build/Household.json');
const compiledExchange = require('../ethereum/build/Exchange.json');
const exchange = require('../ethereum/exchange.js');
const factory = require('../ethereum/factory.js');

class Agent{
    constructor(batteryCapacity){
        this.currentDate = this.getDate();
        this.currentTime = this.getCurrentTime();

        this.excessEnergy = 0;
        this.batteryCapacity = batteryCapacity;

        this.balance = 0;
        this.historicalDemand = [];
        this.historicalSupply = [];

        this.ethereumAddress = '';
        this.accounts = [];
        this.deploymentSuccess = false;

        // TODO: create household variable
    }

    async setSmartMeterDetails(demand, supply){
        if(supply > demand){
            this.excessEnergy = supply - demand;
        }
        await this.newHousehold.methods.setSmartMeterDetails(demand, supply, this.excessEnergy).send({
            from: this.ethereumAddress,
            gas: '1999999'
        });
    }

    async getAccount() {
        let accounts = await web3.eth.getAccounts();
        this.ethereumAddress = accounts[1];
        this.accounts = accounts;
    }

    async getAgentBalance() {
        let balance = await web3.eth.getBalance(this.ethereumAddress);
        this.balance = balance;
    }

    async placeBuy(price, amount){
        await this.newHousehold.methods.submitBid(price, amount).send({
            from: this.ethereumAddress,
            gas: '1000000'
        });
    }

    async placeAsk(price, amount){
        await this.newHousehold.methods.submitAsk(price, amount).send({
            from: this.ethereumAddress,
            gas: '1000000'
        });
    }

    async deployContract(batteryCapacity) {

        await factory.methods.createHousehold(batteryCapacity).send({
            from: this.ethereumAddress,
            gas:'1999999'
        });

        
        let households = await factory.methods.getDeployedHouseholds().call(); 

        let newHousehold = await new web3.eth.Contract(
            JSON.parse(compiledHousehold.interface),
            households[0]
        );
        this.householdAddress = newHousehold.options.address;
        this.newHousehold = newHousehold;

        await newHousehold.methods.setExchange(exchange.options.address).send({
            from: this.ethereumAddress,
            gas: '1999999'
        });
        
        //Initial deposit of 1 ether to contract
        // await newHousehold.methods.deposit().send({
        //     from: this.ethereumAddress,
        //     gas: '1999999',
        //     value: web3.utils.toWei( '1', 'ether')
        // });

        return true;
    }

    async chargeContract(amount){
        await this.newHousehold.methods.charge(amount).send({
            from: this.ethereumAddress,
            gas: '1000000'
        });
    }

    async dischargeContract(amount){
        await this.newHousehold.methods.discharge(amount).send({
            from: this.ethereumAddress,
            gas: '1000000'
        });
    }

    getDate(){
        let today = new Date();
        let day = today.getDate();
        let month = today.getMonth() + 1;
        let year = today.getFullYear();
        let currentDate = day + "/" + month + "/" + year;
        return currentDate;
    }

    getCurrentTime() {
        let time = new Date();
        let hours = time.getHours();
        let minutes = time.getMinutes();
        
        if (minutes < 10) {
            minutes = "0" + minutes;
         }

        let currentTime = hours + ":" + minutes;
        return currentTime;
    }
}

module.exports = Agent;