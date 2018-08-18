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
const compiledHousehold = require('../ethereum/build/Household.json');
const factory = require('../ethereum/factory');
const exchange = require('../ethereum/exchange');

//calc functions
const { gaussian, getDistributionParameters }= require('./gaussian');


class Agent{
    constructor(batteryCapacity, batteryBool){
        this.timeRow = 0;
        this.balance =0;
        this.householdAddress = 0;
        this.household = 0;
        this.ethereumAddress = '';
        this.hasBattery = batteryBool;
        this.priceOfEther = 260;
        this.weiPerEther = 1000000000000000000;

        //bids
        this.bidsToPlace = new Array();

        //elect related variables
        this.batteryCapacity = batteryCapacity;
        this.amountOfCharge = batteryCapacity;
        this.excessEnergy = 0;
        this.shortageEnergy = 0;
        this.currentDemand = 0;
        this.currentSupply = 0; 
        this.historicalDemand = new Array();
        this.historicalSupply = new Array();
        this.historicalPrices =  new Array();
        this.bidHistory = new Array();
        this.askHistory = new Array();
        this.householdID = 0;
        this.baseElectValue = 0;
        this.baseElectValueBattery = 0;
        this.nationalGridPrice = 0.1437;

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
        console.log('i have demand data', this.historicalDemand[this.timeRow].demand);
        console.log('i have supply data', this.historicalSupply[this.timeRow].supply);
        this.baseElectValue = + parseFloat(baseElectValue).toFixed(3);
        this.baseElectValueBattery = + parseFloat(baseElectValueBattery).toFixed(3);

        return true;
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
        return this.ethereumAddress;
    }

    async getAgentBalance() {
        let balance = await web3.eth.getBalance(this.ethereumAddress);
        this.balance = balance;
        return balance;
    }

    async depositEther(value){
        await this.household.methods.deposit().send({
            from: this.ethereumAddress,
            gas: '1999999',
            value: web3.utils.toWei( `${value}`, 'ether')
        });
    }

    async placeBuy(price, amount, date){
        console.log(`placing buy from ${this.householdID}` );
        this.bidHistory.push(new Array(price, amount, date));

        await this.household.methods.submitBid(price, amount, date).send({
            from: this.ethereumAddress,
            gas: '1000000'
        });
        return true;
    }

    async placeAsk(price, amount, date){
        console.log(`placing ask from ${this.householdID}` );
        this.askHistory.push(new Array(price, amount, date));

        await this.household.methods.submitAsk(price, amount, date).send({
            from: this.ethereumAddress,
            gas: '1000000'
        });
        return true;
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
            value: web3.utils.toWei( '50', 'ether')
        });

        return this.household;
    }

    async chargeContract(amount){
        this.amountOfCharge += amount;
        await this.household.methods.charge(amount).send({
            from: this.ethereumAddress,
            gas: '1000000'
        });
    }

    async dischargeContract(amount){
        this.amountOfCharge += amount;
        await this.household.methods.discharge(amount).send({
            from: this.ethereumAddress,
            gas: '1000000'
        });
    }

    setCurrentTime(row){
        this.timeRow = row;        
    }

    async purchaseLogic() {
        console.log(`this is the demand for agent ${this.householdID}: ${this.historicalDemand[this.timeRow].demand} `);
        console.log(`this is the supply for agent ${this.householdID}: ${this.historicalSupply[this.timeRow].supply} `);
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
            shortageEnergy = shortageEnergy * 1000; //convert to Wh
        }

        if(this.hasBattery == true) {
            console.log('i am inside the logic for battery holders');
            if(supply == demand) {
                bidsCount =await exchange.methods.getBidsCount().call();
                
                if (bidsCount > 0) {
                    bid = await exchange.methods.getBid (bidsCount - 1).call();

                    if(this.historicalPrices[this.timeRow - 24] != null || this.historicalPrices[this.timeRow - 24] != undefined){
                        if(bid.price > this.historicalPrices[this.timeRow - 24]){
    
                            await this.household.methods.placeAsk(bid.price, excessEnergy, time)
                        }
                    }
                }
                
            }

            if(excessEnergy > 0){
                if (this.amountOfCharge< 0.5 * this.batteryCapacity){
                    this.chargeContract(excessEnergy);
                }
                else if (0.5*this.batteryCapacity < this.amountOfCharge && this.amountOfCharge< 0.8 ){
                    bidsCount =await exchange.methods.getBidsCount().call();

                    if( bidsCount > 0) {
                        bid = await exchange.methods.getBid(bidsCount-1).call();
                        if(this.historicalPrices[this.timeRow - 24] != null || this.historicalPrices[this.timeRow - 24] != undefined){
                            if(bid.price > this.historicalPrices[this.timeRow - 24]){
                                await this.placeAsk(bid.price, excessEnergy, time);
                            }
                            //check for possible problem in case none of them is true (ATTENTION!!!)
                            else if(bid.price <= this.historicalPrices[this.timeRow - 24]){
                                if( this.amountOfCharge + excessEnergy <= this.batteryCapacity) {
                                    this.chargeContract(excessEnergy);
                                }                           
                            }
                        }
                    }
                    else {
                        this.chargeContract(excessEnergy);
                    }
                    
                    
                }
                else if (this.amountOfCharge >= this.batteryCapacity * 0.8 ){
                    price = this.formulatePrice();
                    price = this.convertToWei(price);
                    await this.placeAsk(price, excessEnergy, time);
                }
            }
            else if (shortageOfEnergy > 0){
                if (this.amountOfCharge > 0.2 * this.batteryCapacity){
                    this.amountOfCharge -= shortageOfEnergy;
                    this.dischargeContract(shortageOfEnergy);
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
                console.log('have excess of energy');
                bidsCount =await exchange.methods.getBidsCount().call();
                
                if(bidsCount > 0){
                    bid = await exchange.methods.getBid(bidsCount - 1).call();
                    await this.placeAsk(bid.price, excessEnergy, time); //no need to convert, it's already getting the value in Wei
                }
                else {
                    price = this.formulatePrice();
                    price = this.convertToWei(price); 
                    await this.placeAsk(price, excessEnergy, time);
                }
                
            }
            if(shortageOfEnergy > 0){
                console.log('have shortage of energy ');
                asksCount = await exchange.methods.getAsksCount().call();
            
                if(asksCount > 0) {
                    ask = await exchange.methods.getAsk(asksCount - 1).call();
                    await this.placeBuy(ask.price, shortageOfEnergy, time); //no need to convert, it's already getting the value in Wei
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
        if (price == undefined || price == null){
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