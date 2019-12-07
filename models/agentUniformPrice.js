
//Using ganache
//const web3 = require('../test/Agent.test.js'); //ganache instance
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3 ( new Web3.providers.HttpProvider("http://localhost:8545"));


//compiled contracts
const exchange = require('../ethereum/exchange');

//calc functions
const gaussian = require('./gaussian');


class Agent{
    constructor(batteryCapacity, batteryBool){
        this.timeRow = 0;
        this.balance =0;
        this.householdAddress = 0;
        this.household = 0;
        this.nationalGridAddress = 0;
        this.hasBattery = batteryBool;
        this.priceOfEther = 250;
        this.WEI_IN_ETHER = 1000000000000000000;
        this.balanceHistory = [];

        //elect related variables
        this.batteryCapacity = batteryCapacity;
        this.amountOfCharge = batteryCapacity;
        this.chargeHistory = [batteryCapacity];
        this.excessEnergy = 0;
        this.shortageEnergy = 0;
        this.currentDemand = 0;
        this.currentSupply = 0; 
        this.historicalDemand = [];
        this.historicalSupply = [];
        this.historicalPrices =  [];
        this.successfulBidHistory = [];
        this.successfulAskHistory = [];
        this.nationalGridPurchases = [];
        this.bidHistory = [];
        this.askHistory = [];
        this.householdID = 0;
        this.baseElectValue = 0;
        this.baseElectValueBattery = 0;
        this.nationalGridPrice = 0.1437;
        this.blackOutTimes = [];
    }

    async loadSmartMeterData(historicData, baseElectValue, baseElectValueBattery, householdID){
        this.householdID = householdID;
        
        for (i=1; i<historicData.length-1; i++){
            let currentDemand = {
                time: historicData[i][0], 
                demand: parseFloat(historicData[i][1]) * 1000
            }

            let currentSupply = {
                time: historicData[i][0], 
                supply: parseFloat(historicData[i][2]) * 1000
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

    async setAgentBalance() {
        let balance = 0;
        balance = await web3.eth.getBalance(this.ethereumAddress);
        this.balanceHistory.push(balance);
    }

    async setNationalGrid(nationalGridPrice, nationalGridAddress ) {
        let nationalGridPriceEther = nationalGridPrice / 250; 
        let nationalGridPriceWei = await web3.utils.toWei(`${nationalGridPriceEther}`, 'ether');
        this.nationalGridPrice = nationalGridPriceWei;
        this.nationalGridAddress = nationalGridAddress;
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

    async buyFromNationalGrid(amount) {
        let amountTransaction = this.nationalGridPrice * (amount/1000);
        amountTransaction = parseInt( + amountTransaction.toFixed(18));
        let transactionReceipt = 0;
        try{
            transactionReceipt = await web3.eth.sendTransaction({to: this.nationalGridAddress, from: this.ethereumAddress, value: amountTransaction, gas: '2000000'});
        }catch(err){console.log('buying from national grid error', err)};

        let date = (new Date).getTime();

        let newTransactionReceipt = {
            transactionReceipt: transactionReceipt,
            transactionCost: transactionReceipt.gasUsed,
            transactionAmount: amountTransaction,
            date: date,
            quantity: amount,
            timeRow: this.timeRow
        }

        this.nationalGridPurchases.push(newTransactionReceipt);
        this.charge(amount);
        return transactionReceipt;
    }

    async sendFunds(price, amount, receiver) {
        let amountTransaction = price * (amount/1000);
        amountTransaction = parseInt(amountTransaction);
        let transactionReceipt = 0 ;
        
        try{
            transactionReceipt = await web3.eth.sendTransaction({to: receiver, from: this.ethereumAddress, value: amountTransaction});
        }catch(err){
            console.log('error in sending funds', err);
        }
        let date = (new Date).getTime();
        let newTransactionReceipt = {
            transactionReceipt: transactionReceipt,
            transactionCost: transactionReceipt.gasUsed,
            transactionAmount: amountTransaction,
            timeRow: this.timeRow,
            quantity: amount,
            receiver: receiver,
            date: date
        }
        this.successfulBidHistory.push(newTransactionReceipt);
        this.charge(amount);
        return transactionReceipt;
    }

    convertWeiToPounds(weiValue) {
        let costEther = weiValue / this.WEI_IN_ETHER;
        let costPounds = costEther * ( + this.priceOfEther.toFixed(18));
        costPounds = + costPounds.toFixed(3);
        return costPounds;
    }

    async placeBuy(price, amount, date){
        let transactionReceipt = 0 ;
        try{
            transactionReceipt = await exchange.methods.placeBid(price, amount, date).send({
                from: this.ethereumAddress,
                gas: '3000000'
            });
        }catch(err){
            console.log('error in placeBuy', err);
        }
        
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
        let transactionReceipt = 0 ;
        try{
            transactionReceipt = await exchange.methods.placeAsk(price, amount, date).send({
                from: this.ethereumAddress,
                gas: '3000000'
            });
        }catch(err){
            console.log('error in placeAsk', err);
        }
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

    updateCharge() {
        
        if(this.chargeHistory[this.chargeHistory.length-1].timeRow != this.timeRow) {
            let newObj = {
                timeRow: this.timeRow,
                charge: this.amountOfCharge
            }
            this.chargeHistory.push(newObj);
        }
        
    }

    charge(amount){
        this.amountOfCharge += amount;
        if(this.amountOfCharge > this.batteryCapacity) {
            this.amountOfCharge = this.batteryCapacity;
        }
        let newObj = {
            timeRow: this.timeRow,
            charge: this.amountOfCharge
        }
        this.chargeHistory.push(newObj);
    }

    discharge(amount){
        this.amountOfCharge -= amount;
        if(this.amountOfCharge <= 0) {
            this.amountOfCharge = 0;
            let newBlackOut = {
                timeRow: this.timeRow,
                blackOut: 1
            }
            this.blackOutTimes.push(newBlackOut);
        }
        let newObj = {
            timeRow: this.timeRow,
            charge: this.amountOfCharge
        }
        this.chargeHistory.push(newObj); 
    }

    setCurrentTime(row){
        this.timeRow = row;
    }

    unfilledOrdersProcess(){
        let demand = this.historicalDemand[this.timeRow].demand;
        let supply = this.historicalSupply[this.timeRow].supply;
        
        let excessEnergy = 0;
        let shortageOfEnergy = 0;

        if(supply > demand) {
            excessEnergy = supply - demand;
            this.charge(excessEnergy);
        }
        if(supply < demand) {
            shortageOfEnergy = demand - supply;
            this.discharge(shortageOfEnergy);
        }
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
            excessEnergy = excessEnergy; 
        }
        if(supply < demand) {
            shortageOfEnergy = demand - supply;
            shortageOfEnergy = shortageOfEnergy; 
        }

        if(this.hasBattery == true) {
            if(supply == demand) {
                bidsCount = await exchange.methods.getBidsCount().call();
                if (this.amountOfCharge < 0.5 * this.batteryCapacity){
                    this.charge(excessEnergy);
                }
                else if (bidsCount > 0) {
                    bid = await exchange.methods.getBid(bidsCount - 1).call();

                    if(this.historicalPrices[this.timeRow - 24] != null || this.historicalPrices[this.timeRow - 24] != undefined){
                        let averagePrice = this.calculateYesterdayAverage()
                        if(bid.price > averagePrice){
    
                            await this.placeAsk(bid[1], excessEnergy, time);
                        }
                    }
                }
                
            }

            if(excessEnergy > 0){
                
                if (this.amountOfCharge < 0.5 * this.batteryCapacity){
                    this.charge(excessEnergy);
                }
                else if (0.5*this.batteryCapacity < this.amountOfCharge && this.amountOfCharge< 0.8 ){
                    bidsCount = await exchange.methods.getBidsCount().call();

                    if( bidsCount > 0) {
                        bid = await exchange.methods.getBid(bidsCount-1).call();
                        if(this.historicalPrices[this.timeRow - 24] != null || this.historicalPrices[this.timeRow - 24] != undefined){
                            let averagePrice = this.calculateYesterdayAverage();

                            if(bid[1] > averagePrice){
                                await this.placeAsk(bid[1], excessEnergy, time);
                            }
                            else if(bid[1] <= averagePrice){
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
                    price = await this.convertToWei(price);
                    await this.placeAsk(price, excessEnergy, time);
                }
            }
            else if (shortageOfEnergy > 0){
                let amountOfCharge = this.amountOfCharge;
                let batteryCapacity = this.batteryCapacity;
                let halfBattery = 0.5 * batteryCapacity;

                 if (amountOfCharge > halfBattery){
                    this.discharge(shortageOfEnergy);
                    return true;
                }
                else if(this.amountOfCharge < 0.5 * this.batteryCapacity && this.amountOfCharge > 0.2 * this.batteryCapacity){
                    let price = this.formulatePrice();
                    let amount = this.formulateAmount();

                    if( amount === false) {
                        return;
                    }
                    
                    price = await this.convertToWei(price);
                    await this.placeBuy(price, amount, time);
                }
                else if (this.amountOfCharge <= 0.2 * this.batteryCapacity){
                    //shortage of energy or buy 50% of the batterys capacity
                    await this.buyFromNationalGrid(0.5 * this.batteryCapacity);
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
                    price = await this.convertToWei(price);
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

                    await this.buyFromNationalGrid(shortageOfEnergy);
                }
            }
        }
    }

    formulateAmount() {
        //look 10 hours ahead
        let timeInterval = 10;
        let supplySum = 0;
        let demandSum = 0;
        let energyNeeded = 0
        for(let i = this.timeRow ; i < this.timeRow + timeInterval; i++) {
            supplySum += this.historicalSupply[i].supply;
            demandSum += this.historicalDemand[i].demand;
            
        }
        if(supplySum - demandSum >= 0) {
            return false;
        }
        if(supplySum - demandSum < 0) {
            energyNeeded = Math.abs(supplySum - demandSum);
        }
        if(this.amountOfCharge + energyNeeded >= this.batteryCapacity) {
            energyNeeded = this.batteryCapacity - this.amountOfCharge;
        }
        return energyNeeded;
    }

    async convertToWei(price) {
        let calcPrice = (price / this.priceOfEther);
        calcPrice = calcPrice.toFixed(18);
        try{
            price = await web3.utils.toWei(calcPrice, 'ether');
        }catch(err){console.log('error from conversion', err)};
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
                return value;
            }
        } 
    }    
}

module.exports = Agent;