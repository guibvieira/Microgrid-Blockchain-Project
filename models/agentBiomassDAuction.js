//Using ganache
//const web3 = require('../test/Agent.test.js'); //ganache instance
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3 ( new Web3.providers.HttpProvider("http://localhost:8545"));

//calc functions
const gaussian = require('./gaussian');
const {convertArrayGasToPounds, convertArrayWeiToPounds, convertWeiToPounds, convertGasToPounds} = require('../simulation/conversions.js');

//compiled contracts
const compiledHousehold = require('../ethereum/build/Household.json');
const factory = require('../ethereum/factory');
const exchange = require('../ethereum/exchange');


class AgentBiomass{
    constructor(BIOMASS_PRICE_MIN, BIOMASS_PRICE_MAX){
        this.biomassPrice = BIOMASS_PRICE_MAX; //0.06 to 0.12
        this.baseElectValue = BIOMASS_PRICE_MIN;
        this.maxElectValue = BIOMASS_PRICE_MAX;
        this.tradingHistory = new Array();
        this.askHistory =  new Array();
        this.balanceHistory = new Array();
        this.generationData = new Array();
        this.successfulAskHistory = new Array();
        this.timeRow = 0;
        this.biomassAddress = 0;
        this.unFilledAsks = new Array();
        this.PRICE_OF_ETHER = 250; 
        this.WEI_IN_ETHER = 1000000000000000000;
    }

    loadData(biomassData) {
        
        for (i = 0; i < biomassData.length; i++){

            let currentSupply = {
                time: i, 
                supply: + parseFloat(biomassData[i]).toFixed(0) *  1000 //convert to Wh
            }
            
            this.generationData.push(currentSupply);
        }

        return true;
    }

    async deployContract () {

        await factory.methods.createHousehold(0).send({
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
            value: web3.utils.toWei( '10', 'ether')
        });

        return this.household;
    }

    setCurrentTime(time) {
        this.timeRow = time;
    }

    addUnsuccessfulAsk(ask) {
        this.unFilledAsks.push(ask);
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
        //let price = await this.convertToWei(this.baseElectValue);
        //OR let price = this.formulatePrice(); for variation of prices
        //let price1 = this.formulatePrice();
        //let price2 = this.formulatePrice();
        let price1 = await this.convertToWei(this.baseElectValue);
        let price2 = await this.convertToWei( this.maxElectValue);
  
  
        await this.placeAsk(price1, this.generationData[this.timeRow].supply/2);
        await this.placeAsk(price2, this.generationData[this.timeRow].supply/2);
    }

    addSuccessfulAsk(amount) {
        let date = (new Date).getTime();

        let newReceivedTransaction = {
            amount: amount,
            date: date,
            timeRow: this.timeRow
        }
        this.successfulAskHistory.push(newReceivedTransaction);
    }

    async placeAsk(price, amount){
        let date = (new Date()).getTime();

        let checkPrice = convertWeiToPounds(price, this.WEI_IN_ETHER, this.PRICE_OF_ETHER);

        let transactionReceipt = await this.household.methods.placeAsk(price, amount, date).send({
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
        let calcPrice = (price / this.PRICE_OF_ETHER);
        calcPrice = + calcPrice.toFixed(18);
        price = await web3.utils.toWei(`${calcPrice}`, 'ether');
        price = parseInt(price);
        return price;
    }

    formulatePrice() {
        let {mean, stdev} = this.getDistributionParameters();
        let price = this.getCorrectValue(mean, stdev);
        //sometimes this returns defined, therefore while loop to prevent this
        while (price === undefined || price === null){
            price = this.getCorrectValue(mean, stdev);
        }
        return price;
    }

    getDistributionParameters(){
        
        let minPrice = this.baseElectValue;
        let maxPrice = this.maxElectValue;
        let mean = ( minPrice + maxPrice) / 2;
        let stdev = ( - minPrice + mean) / 2;
        return { mean, stdev };
        
    }

    getCorrectValue(mean, stdev){
        let standard = gaussian(mean, stdev);
        
        let value = standard();
        while(value < this.maxElectValue && value > this.baseElectValue){
            
            return value;
        }
        
    } 
            
    
}

module.exports = AgentBiomass;