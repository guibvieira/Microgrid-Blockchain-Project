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
//const web3 = require('../test/Agent.test.js'); //ganache instance
const ganache = require('ganache-cli');
// const Web3 = require('web3');
// const web3 = new Web3( new Web3.providers.HttpProvider("http://localhost:8545"));
const web3 = require('../ethereum/web3-ganache.js');

//compiled contracts
const compiledHousehold = require('../ethereum/build/Household.json');
const factory = require('../ethereum/factory');
const exchange = require('../ethereum/exchange');


class Agent{
    constructor(batteryCapacity){
        this.getDate();
        this.getCurrentTime();
        this.balance =0;
        this.householdAddress = 0;
        this.household = 0;


        this.batteryCapacity = batteryCapacity; 
        this.excessEnergy = 0;
        this.shortageEnergy = 0;
        this.currentDemand = 0;
        this.currentSupply = 0; 
        this.historicalDemand = new Array();
        this.historicalSupply = new Array();
        this.householdID = 0;
        this.baseElectValue = 0;
        this.baseElectValueBattery = 0;
              
    }

    loadSmartMeterData(historicData, baseElectValue, baseElectValueBattery){
        for (i=1; i<historicData.length; i++){
            this.historicalDemand.push(new Array(historicData[i][0], historicData[i][1]));
            this.historicalSupply.push(new Array(historicData[i][0], historicData[i][2]));
        }
        this.baseElectValue = baseElectValue;
        this.baseElectValueBattery = baseElectValueBattery;
    }
    async setSmartMeterDetails(demand, supply){
        if(supply>demand){
            this.excessEnergy = supply - demand;
        }
        if(supply<demand){
            this.shortageEnergy = demand - supply;
        }
        await this.household.methods.setSmartMeterDetails(demand, supply, this.excessEnergy).send({
            from: this.ethereumAddress,
            gas: '1000000'
        });
    }

    async getAccount(index) {
        let accounts = await web3.eth.getAccounts();
        this.ethereumAddress = accounts[index];
    }

    async getAgentBalance() {
        let balance = await web3.eth.getBalance(this.ethereumAddress);
        this.balance = balance;
    }

    async depositEther(value){
        await this.household.methods.deposit().send({
            from: this.ethereumAddress,
            gas: '1999999',
            value: web3.utils.toWei( `${value}`, 'ether')
        });
    }

    async placeBuy(price, amount, date){
        await this.household.methods.submitBid(price, amount, date).send({
            from: this.ethereumAddress,
            gas: '1000000'
        });
    }

    async placeAsk(price, amount, date){
        await this.household.methods.submitAsk(price, amount, date).send({
            from: this.ethereumAddress,
            gas: '1000000'
        });
    }

    async deployContract () {

        await factory.methods.createHousehold(this.batteryCapacity).send({
            from: this.ethereumAddress,
            gas: '1000000'
        });
        let households = await factory.methods.getDeployedHouseholds().call(); 

        let household = await new web3.eth.Contract(
            JSON.parse(compiledHousehold.interface),
            households[0]
        );
        this.householdAddress = household.options.address;
        this.household = household;

        await this.household.methods.setExchange(exchange.options.address).send({
            from: this.ethereumAddress,
            gas: '1999999'
        });
        
        //Initial deposit of 1 ether to contract
        await this.household.methods.deposit().send({
            from: this.ethereumAddress,
            gas: '1999999',
            value: web3.utils.toWei( '5', 'ether')
        });

        return this.household;
    }

    async chargeContract(amount){
        await this.household.methods.charge(amount).send({
            from: this.ethereumAddress,
            gas: '1000000'
        });
    }

    async dischargeContract(amount){
        await this.household.methods.discharge(amount).send({
            from: this.ethereumAddress,
            gas: '1000000'
        });
    }

    getDate(){
        var today = new Date();
        var day = today.getDate();
        var month = today.getMonth() + 1;
        var year = today.getFullYear();
        this.currentDate = day + "/" + month + "/" + year;
    }

    getCurrentTime() {
        var time = new Date();
        var hours = time.getHours();
        var minutes = time.getMinutes();
        
        if (minutes < 10) {
            minutes = "0" + minutes;
         }

        this.currentTime = hours + ":" + minutes;
    }
}

module.exports = Agent;