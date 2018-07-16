//const web3 = require('../ethereum/web3.js');


// const factory = require('../ethereum/factory.js');
// const exchange = require('../ethereum/exchange.js');
const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const provider = new HDWalletProvider('pulse stable fever half settle phone impact theory crater grit chef census',
                                    'https://rinkeby.infura.io/YDnIBMV5OY1S3hf9iVWn'
);
const web3 = new Web3(provider);
const compiledFactory = require('../ethereum/build/HouseholdFactory.json');
const compiledHousehold = require('../ethereum/build/Household.json');
const compiledExchange = require('../ethereum/build/Exchange.json');

class Agent{
    constructor(batteryCapacity){
        this.getDate();
        this.getCurrentTime();
        this.balance =0;
        // this.getAccount(0);
        // this.getAgentBalance();
        //this.deploymentSuccess = this.deployContract(batteryCapacity);
    }

    async getAccount(index) {
        let accounts = await web3.eth.getAccounts();
        this.ethereumAddress = accounts[index];
    }

    async getAgentBalance() {
        let balance = await web3.eth.getBalance(this.ethereumAddress);
        this.balance = balance;
    }

    async deployContract (batteryCapacity ) {

        accounts = await web3.eth.getAccounts();

        factory = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
        .deploy({ data: compiledFactory.bytecode })
        .send({ from: accounts[0], gas: '1999999' });

        exchange = await new web3.eth.Contract(JSON.parse(compiledExchange.interface))
        .deploy({ data: compiledExchange.bytecode })
        .send({ from: accounts[0], gas: '1999999' });

        await factory.methods.createHousehold(batteryCapacity).send({
            from: accounts[0],
            gas:'1999999'
        });

        households = await factory.methods.getDeployedHouseholds().call(); //the square brackets is a deconstructing array thing, which extract the first element of the array to assign it to campaignAddress
        newHousehold = await new web3.eth.Contract(
            JSON.parse(compiledHousehold.interface),
            households[households.lenght-1]
        );
        //save household instance and address to Class
        this.household = newHousehold;
        this.householdAddress = newHousehold.options.address;

        await newHousehold.methods.setExchange(exchange.options.address).send({
            from: acounts[0],
            gas: '1999999'
        });

        await newHousehold.methods.deposit().send({
            from: accounts[0],
            gas: '1999999'
        });

        return true;
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