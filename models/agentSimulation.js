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
const Web3 = require('web3');
const web3 = new Web3 ( new Web3.providers.HttpProvider("http://localhost:8545"));


//compiled contracts
const exchange = require('../ethereum/exchange');

//calc functions
const { gaussian, getDistributionParameters } = require('./gaussian');


class Agent{
    constructor(batteryCapacity, batteryBool){
        //FIND WAY TO CLACULATE AVERAGE OF PRICES FOR AN ENTIRE DAY (ATTENTION !!!!)
        this.timeRow = 0;
        this.balance =0;
        this.householdAddress = 0;
        this.household = 0;
        this.nationalGridAddress = 0;
        this.hasBattery = batteryBool;
        this.priceOfEther = 250;
        this.weiPerEther = 1000000000000000000;

        //elect related variables
        this.batteryCapacity = batteryCapacity;
        this.amountOfCharge = batteryCapacity;
        this.chargeHistory = [batteryCapacity];
        this.excessEnergy = 0;
        this.shortageEnergy = 0;
        this.currentDemand = 0;
        this.currentSupply = 0; 
        this.historicalDemand = new Array();
        this.historicalSupply = new Array();
        this.historicalPrices =  new Array();
        this.successfulBidHistory = new Array();
        this.successfulAskHistory = new Array();
        this.nationalGridPurchases = new Array();
        this.bidHistory = new Array();
        this.askHistory = new Array();
        this.householdID = 0;
        this.baseElectValue = 0;
        this.baseElectValueBattery = 0;
        this.nationalGridPrice = 0.1437;
        this.blackOutTimes = new Array();

        //predictor vars
        this.timeInterval = 3;
        this.learningRate = 0.15;
        this.weightDemandAvg = 1;
        this.weightDemandRand = 1;
        this.weightDemandRat = 1;
        this.predAvg = 0;
        this.predRand = 0;
        this.predRat = 0;
        this.predDemand= 0;
        
        this.finalDemandPred = 0;

              
    }

    async loadSmartMeterData(historicData, baseElectValue, baseElectValueBattery, householdID){
        this.householdID = householdID;
        
        for (i=1; i<historicData.length-1; i++){
            let currentDemand = {
                time: historicData[i][0], 
                demand: + parseFloat(historicData[i][1]).toFixed(3)
            }

            let currentSupply = {
                time: historicData[i][0], 
                supply: + parseFloat(historicData[i][2]).toFixed(3)
            }
            
            this.historicalDemand.push(currentDemand);
            this.historicalSupply.push(currentSupply);
        }
        this.baseElectValue = + parseFloat(baseElectValue).toFixed(3);
        this.baseElectValueBattery = + parseFloat(baseElectValueBattery).toFixed(3);

        return true;
    }

    async getAccount(index) {
        let accounts = await web3.eth.getAccounts();
        this.ethereumAddress = accounts[index];
        return this.ethereumAddress;
    }

    async getAgentBalance() {
        let balance = await web3.eth.getBalance(this.ethereumAddress);
        this.balance = balance;
        return balance;
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

    buyFromNationalGrid(price, amount) {
        let amountTransaction = price * (amount/1000);
        amountTransaction = parseInt(amountTransaction);
        let transactionReceipt = await web3.eth.sendTransaction({to: this.nationalGridAddress, from: this.ethereumAddress, value: amountTransaction});
        let date = (new Date).getTime();
        let newTransactionReceipt = {
            transactionReceipt: transactionReceipt,
            transactionCost: transactionReceipt.gasUsed,
            date: date
        }
        this.successfulBidHistory.push(newTransactionReceipt);
        this.charge(amount);
        return transactionReceipt;
    }

    async sendFunds(price, amount, receiver) {
        let amountTransaction = price * (amount/1000);
        amountTransaction = parseInt(amountTransaction);
        let transactionReceipt = await web3.eth.sendTransaction({to: receiver, from: this.ethereumAddress, value: amountTransaction});
        let date = (new Date).getTime();
        let newTransactionReceipt = {
            transactionReceipt: transactionReceipt,
            transactionCost: transactionReceipt.gasUsed,
            date: date
        }
        this.successfulBidHistory.push(newTransactionReceipt);
        this.charge(amount);
        return transactionReceipt;
    }

    async placeBuy(price, amount, date){

        let transactionReceipt = await exchange.methods.placeBid(price, amount, date).send({
            from: this.ethereumAddress,
            gas: '3000000'
        });
        let newBid = {
            address: this.ethereumAddress,
            price: price,
            amount: amount,
            date: date,
            timeRow: this.timeRow,
            transactionCost: transactionReceipt.gasUsed
        }
        this.bidHistory.push(newBid);
        return true;
    }

    async placeAsk(price, amount, date){

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

    setInitialCharge() {
        console.log('initial battery capacity', this.batteryCapacity);
        console.log('initial time row', this.timeRow);
        this.chargeHistory.push(new Array(this.batteryCapacity, this.timeRow));
    }

    charge(amount){
        this.amountOfCharge += amount;
        if(this.amountOfCharge > this.batteryCapacity) {
            this.amountOfCharge = this.batteryCapacity;
        }
        this.chargeHistory.push(this.amountOfCharge)//new Array(this.amountOfCharge, this.timeRow);
    }

    discharge(amount){
        this.amountOfCharge -= amount;
        if(this.amountOfCharge <= 0) {
            this.amountOfCharge = 0;
            this.blackOutTimes.push(this.timeRow);
        }
        this.chargeHistory.push(this.amountOfCharge); //new Array(this.amountOfCharge, this.timeRow);
    }

    setCurrentTime(row){
        this.timeRow = row;
        // if(this.bidHistory[this.timeRow - 1].timeRow)     
        // var obj = agentsBattery.find(function (obj) { return obj.agentAccount === acceptedBids[i].address; });
        //if there was a trade last hour, buy or sell, then update that on the amountOfCharge   
    }

    calculateYesterdayAverage() {
        if ( this.timeRow - 24 <= 0){
            return this.timeRow - 24;
        } 
        let scaledTime = (this.timeRow - 24)/24;
        let startOfDay = floor(scaledTime) * 24;
        let endOfDay = startOfDay + 24;
        let sumPrices = 0;
        for (let i = startOfDay; i <= endOfDay; i++) {
            sumPrices += this.historicalPrices[i]
        }
        return sumPrices / 24; // returns the average over that entire day
    }

    async purchaseLogic() {
        let demand = this.historicalDemand[this.timeRow].demand;
        let supply = this.historicalSupply[this.timeRow].supply;
        
        let excessEnergy = 0;
        let shortageOfEnergy = 0;
        let time = (new Date()).getTime();
        let bidsCount = 0;
        let bid = 0;
        let price = 0;
        let asksCount = 0;
        let ask = 0;

        if(supply > demand) {
            excessEnergy = supply - demand;
            excessEnergy = excessEnergy * 1000; //convert to Wh
        }
        if(supply < demand) {
            shortageOfEnergy = demand - supply;
            shortageOfEnergy = shortageOfEnergy * 1000; // convert to Wh
        }

        if(this.hasBattery == true) {
            if(supply == demand) {
                bidsCount = await exchange.methods.getBidsCount().call();
                if (this.amountOfCharge< 0.5 * this.batteryCapacity){
                    this.charge(excessEnergy);
                }
                else if (bidsCount > 0) {
                    bid = await exchange.methods.getBid(bidsCount - 1).call();

                    if(this.historicalPrices[this.timeRow - 24] != null || this.historicalPrices[this.timeRow - 24] != undefined){
                        if(bid.price > this.historicalPrices[this.timeRow - 24]){
    
                            await this.placeAsk(bid[1], excessEnergy, time)
                        }
                    }
                }
                
            }

            if(excessEnergy > 0){
                if (this.amountOfCharge< 0.5 * this.batteryCapacity){
                    this.charge(excessEnergy);
                }
                else if (0.5*this.batteryCapacity < this.amountOfCharge && this.amountOfCharge< 0.8 ){
                    bidsCount = await exchange.methods.getBidsCount().call();

                    if( bidsCount > 0) {
                        bid = await exchange.methods.getBid(bidsCount-1).call();
                        if(this.historicalPrices[this.timeRow - 24] != null || this.historicalPrices[this.timeRow - 24] != undefined){
                            if(bid[1] > this.historicalPrices[this.timeRow - 24]){
                                await this.placeAsk(bid[1], excessEnergy, time);
                            }
                            //check for possible problem in case none of them is true (ATTENTION!!!)
                            else if(bid.price <= this.historicalPrices[this.timeRow - 24]){
                                if( this.amountOfCharge + excessEnergy <= this.batteryCapacity) {
                                    this.charge(excessEnergy);
                                }                           
                            }
                        }
                    }
                    else {
                        this.charge(excessEnergy);
                    }
                    
                    
                }
                else if (this.amountOfCharge >= this.batteryCapacity * 0.8 ){
                    price = this.formulatePrice();
                    price = this.convertToWei(price);
                    await this.placeAsk(price, excessEnergy, time);
                }
            }
            else if (shortageOfEnergy > 0){
                if (this.amountOfCharge > 0.5 * this.batteryCapacity){
                    this.discharge(shortageOfEnergy);
                    return true;
                }
                else if(this.amountOfCharge < 0.5 * this.batteryCapacity && this.amountOfCharge > 0.2 * this.batteryCapacity){
                    price = this.formulatePrice();
                    price = this.convertToWei(price);
                    await this.placeBuy(price, shortageOfEnergy, time);
                }
                else if (this.amountOfCharge <= 0.2 * this.batteryCapacity){
                    price = this.formulatePrice();
                    price = this.convertToWei(price);
                    await this.placeBuy(price, shortageOfEnergy, time);
                }   
            }  
        }

        if(this.hasBattery == false){
            if (excessEnergy > 0) {
                bidsCount =await exchange.methods.getBidsCount().call();
                
                if(bidsCount > 0){
                    bid = await exchange.methods.getBid(bidsCount - 1).call();
                    await this.placeAsk(bid[1], excessEnergy, time); //no need to convert, it's already getting the value in Wei
                }
                else {
                    price = this.formulatePrice();
                    price = this.convertToWei(price);
                    await this.placeAsk(price, excessEnergy, time);
                }
                
            }
            if(shortageOfEnergy > 0){
                asksCount = await exchange.methods.getAsksCount().call();
            
                if(asksCount > 0) {
                    ask = await exchange.methods.getAsk(asksCount - 1).call();
                    await this.placeBuy(ask[1], shortageOfEnergy, time); //no need to convert, it's already getting the value in Wei
                }
                else {
                    price = this.formulatePrice();
                    price = this.convertToWei(price);
                    await this.placeBuy(price, shortageOfEnergy, time);
                }
                
            }
        }
    }

    convertToWei(price) {
        let calcPrice = (price / this.priceOfEther);
        calcPrice = calcPrice.toFixed(18);
        price = web3.utils.toWei(calcPrice, 'ether');
        price = parseInt(price);
        return price;
    }

    formulatePrice() {
            let {mean, stdev} = this.getDistributionParameters();
            let price = this.getCorrectValue(mean, stdev);
            while (price === undefined || price === null){
                price = this.getCorrectValue(mean, stdev);
            }
            return price;
    }

    getDistributionParameters(){
        if(this.hasBattery == true){
            let minPrice = this.baseElectValueBattery;
            let maxPrice = this.nationalGridPrice;
            let mean = ( minPrice + maxPrice) / 2;
            let stdev = (- minPrice + mean) / 2;
            return { mean, stdev };
        }

        if(this.hasBattery == false){
            let mean = (this.baseElectValue + this.nationalGridPrice) / 2;
            let stdev = (- this.baseElectValue + mean) / 2;
            return { mean, stdev };
        } 
    }

    getCorrectValue(mean, stdev){
        let standard = gaussian(mean, stdev);
        if(this.hasBattery == true){
            let value = standard();
            while(value < this.nationalGridPrice && value > this.baseElectValueBattery){
                
                return value;
            }
        }

        if(this.hasBattery == false){
            let value = standard();
            while(value < this.nationalGridPrice && value > this.baseElectValue){
                console.log('value', value);
                return value;
            }
        } 
    }    
}

module.exports = Agent;