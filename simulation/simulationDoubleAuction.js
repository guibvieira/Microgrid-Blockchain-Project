//requirements
//Using ganache
// const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
web3 = new Web3( new Web3.providers.HttpProvider("http://localhost:8545"))
const Agent = require('../models/agentDoubleAuction.js');
const AgentNationalGrid = require('../models/agentNationalGrid.js');
const AgentBiomass = require('../models/agentBiomassDAuction.js');
const plotly = require('plotly')('guibvieiraProject', 'Whl2UptBOq1gMvQrRGHk');

//compiled contracts
const factory = require('../ethereum/factory');
const exchange = require('../ethereum/exchange');
const compiledHousehold = require('../ethereum/build/Household.json');

//packages and functions imports
const readCSV = require('./readFile.js');
const {convertArrayGasToPounds, convertArrayWeiToPounds, convertWeiToPounds, convertGasToPounds} = require('./conversions.js');
let fs = require('fs');
var csv = require("fast-csv");
let inputFile = '../data/metadata-LCOE.csv';
let id = new Array();
let baseValue = new Array();
let baseValueBattery = new Array();

let agentsNoBattery = new Array();
let agentsBattery = new Array();
let numberOfBids = new Array();



//customisable variables for Simulation
const GASPRICE = 2000000000; //wei
const simulationDays = 1;  // input
const PRICE_OF_ETHER = 250; 
const NATIONAL_GRID_PRICE = 0.1437; //input
const BIOMASS_PRICE_MIN = 0.06; //input
const BIOMASS_PRICE_MAX = 0.12; //input
const WEI_IN_ETHER = 1000000000000000000;
const csvResultsFileName = 'simulationContinuousDoubleAuction_test1.csv'; //input


async function init() {
    let unFilledBids = new Array();
    let unFilledAsks = new Array();
    let amountSuccessFulBids = new Array();
    let aggregatedDemand = new Array();
    let aggregatedSupply = new Array();
    let historicalPricesPlot = new Array();
    let biomassSellHistory = new Array();
    let biomassAgentBalanceHistory = new Array();
    let biomassContractBalanceHistory = new Array();
    let nationalGridBalanceHistory = new Array();
    let bidCount = 0;
    let askCount = 0;

    let successfulBids = new Array();
    let succesfulBidsPrice = new Array();
    let succesfulBidsQuantity = new Array();
    let succesfulBidsTransactionAmount = new Array();

    var accounts = await web3.eth.getAccounts();

    let { metaData, householdHistoricData } = await getFiles();

    let biomassData = generateBiomassData(householdHistoricData);

    let metaDataBattery = metaData.slice(0, Math.floor(metaData.length / 8));

    let householdDataBattery = householdHistoricData.slice(0, Math.floor(householdHistoricData.length) / 8 );

    let { agents, agentNationalGrid, agentBiomass } = await createAgents(metaDataBattery, householdDataBattery, biomassData, 12000, true, BIOMASS_PRICE_MIN, BIOMASS_PRICE_MAX);
    
    let agentsBattery = agents;
    let simulationDurationCalc = 365 / simulationDays;
    let simDuration = householdHistoricData[0].length / Math.round(simulationDurationCalc);    //start simulation

    let nationalGridAddress = await agentNationalGrid.getAccount(accounts.length-1); // make the last account from ganache to be the national grid address
    let biomassAddress = await agentBiomass.getAccount(accounts.length-2);
    let biomassContract = await agentBiomass.deployContract();

    simDuration = Math.round(simDuration);
    let timeArray= new Array();
    console.log(`using ${agentsBattery.length} amount of agents`);
    console.log('sim duration', simDuration);
    console.log('starting simulation');

    for (let i= 0; i < simDuration; i++) {
        timeArray.push(i);
        console.log('time', i);

        nationalGridBalanceHistory.push( await agentNationalGrid.getAgentBalance() ); //initialise the balance count
        let { balance, contractBalance } = await agentBiomass.setAgentBalance();
        biomassAgentBalanceHistory.push( balance );
        biomassContractBalanceHistory.push( contractBalance );
        agentBiomass.setCurrentTime(i);

        try{
            await agentBiomass.sellingLogic();
        }catch(err) {
            console.log('error from selling logic biomass', err);
        }
        

        
        for (let j = 0; j < agentsBattery.length; j++){

            if( i == 0) {
                try{
                    await agentsBattery[j].agent.setNationalGrid(NATIONAL_GRID_PRICE, nationalGridAddress);
                    await agentsBattery[j].agent.getAccount(j);
                    await agentsBattery[j].agent.deployContract();
                }catch(err){
                    console.log('error from first iteration deploying contract', err);
                }
             
            }
            agentsBattery[j].agent.setCurrentTime(i);
            try{
                await agentsBattery[j].agent.setAgentBalance();
            }catch(err) {
                console.log('error from setting agent balance', err);
            }


            
           
            try{
                await agentsBattery[j].agent.purchaseLogic();
            } catch(err){
                console.log('error from purchase logic', err);
            }
            await agentsBattery[j].agent.updateCharge();
        }

        
        bidCount = await exchange.methods.getBidsCount().call();
        askCount = await exchange.methods.getAsksCount().call();   
        

        //price, quantity, and transactionAmount extraction
        let bidsPrice = new Array();
        let bidsQuantity = new Array();
        let bidsTransactionAmount = new Array();
        for (let j = 0; j < agentsBattery.length; j++) {
            
            let bidCount = await agentsBattery[j].agent.household.methods.getSuccessfulBidCount().call();

            for(let k = 0; k < bidCount; k++) {
                let bid = await agentsBattery[j].agent.household.methods.getSuccessfulBid(k).call();
                newBid = {
                    price: parseInt(bid[1]),
                    quantity: parseInt(bid[2]),
                    address: bid[0],
                    time: parseInt(bid[3])
                }
                successfulBids.push(newBid);
                if(newBid.time == i) {
                    bidsPrice.push(newBid.price);
                    bidsQuantity.push(newBid.quantity);
                    bidsTransactionAmount.push(newBid.price * (newBid.quantity/1000));
                }
            }
        }
        succesfulBidsQuantity.push(bidsQuantity.reduce((a, b) => a + b, 0));

        
        if(bidsPrice > 0 ){
            let pricePounds =  convertWeiToPounds(bidsPrice, WEI_IN_ETHER, PRICE_OF_ETHER);
            console.log('price in pounds', pricePounds);
            succesfulBidsPrice.push( (pricePounds / bidsPrice.length) );
        }
        else{
            succesfulBidsPrice.push(0);
        }
        console.log('prices this time', succesfulBidsPrice[i]);
        if(bidsTransactionAmount.length > 0) {
            succesfulBidsTransactionAmount.push( convertWeiToPounds(bidsTransactionAmount, WEI_IN_ETHER, PRICE_OF_ETHER) );
        } else {
            succesfulBidsTransactionAmount.push(0); 
        }
        amountSuccessFulBids.push(bidsPrice.length);

    }

    //balances for agents, agent is gas expenditure, contract is transactionAmountexpenditure
    let agentBalanceAverageAgent = new Array();
    let agentBalanceAverageContract = new Array();
    let agentExpenditureTotal = new Array(); //sum of previous two

    let hourlyExpenditureGas = new Array();
    let hourlyExpenditureTrade = new Array();
    let hourlyExpenditure = new Array();

    //biomass
    let biomassBalance = new Array();
    let biomassAskAmount = new Array();
    let biomassAskGas = new Array();
    let biomassVolumePounds = new Array();
    let biomassVolumeElect = new Array();
    let biomassContractBalanceHourly = new Array();

    
    let history = agentsBattery[0].agent.historicalPrices;
    let aggActualDemand =  new Array();
    let chargeHistoryAggregated = new Array();
    let transactionCostBid = new Array();
    let transactionCostAsk = new Array();
    let transactionCostAvg = new Array();
    let transactionCosts = new Array();
    let chargeDischargeTXCosts = new Array();
    let nationalGridBidsAggAmount= new Array();
    let nationalGridBidsAggGas = new Array();
    let nationalGridPurchases = new Array();
    let nationalGridTotalCost = new Array();
    
    let nationalGridVolumeElect = new Array();
    let tradingVolumeElect = new Array();
    
    let totalNumberTransactions = new Array();
    let successfulBidsAggAmount = new Array();
    let successfulBidsAggGas = new Array();
    let successfulBidsTotalCost = new Array();
    let percentageNatGridEnergyTrades = new Array();
    let dailyVolume = new Array();
    let blackOutInstances = new Array();
    let nationalGridPurchasesDay = new Array();

    //averages parameters (for each agent)
    let averageNumberTransactions = new Array();
    let averageNumberTransactionsDay = new Array();
    let averageNationalGridPurchases = new Array(); 
    let averageNationalGridPurchasesDay = new Array(); 
    let averageExpenditureDayGas = new Array();
    let averageExpenditureDay = new Array();
    let averageAsksDay = new Array();
    let averageBidsDay = new Array();


    let agent

    let simulationCSV = new Array();
    let csvData = new Array();
    

    const sumPrices= history.reduce((a, b) => a + b, 0);
    let averagePrices = sumPrices/simDuration;
    averagePrices = convertWeiToPounds(parseInt(averagePrices), WEI_IN_ETHER, PRICE_OF_ETHER);
    console.log('average of prices', averagePrices);

    //Calculating Parameters from simulation to plot
    //
    for (let i = 0; i < simDuration; i++) {
        let demand = new Array();
        let supply = new Array();
        let charge = new Array();
        let gasCostBids = new Array();
        let gasCostAsks = new Array();
        let nationalGridBidsGas = new Array();
        let nationalGridBidsAmount = new Array();
        let nationalGridSumCosts = new Array();
        let nationalGridBidsQuantity = new Array();

        let biomassBidsElect = new Array();
        let biomassAskGasTemp = new Array();
        let contractInteractionCosts = new Array();
        let agentsBalanceHistoryAgent = new Array();
        let agentsBalanceHistoryContract = new Array();
        let successfulBidsGas = new Array();
        let successfulBidsAmount = new Array();
        let succesfulBidsSumCosts = new Array();
        let successfulBidsElect = new Array();
        
        let agentsBalanceHistory = new Array();




        //conversion from wei to pounds
        historicalPricesPlot[i] = convertWeiToPounds(agentsBattery[0].agent.historicalPrices[i], WEI_IN_ETHER, PRICE_OF_ETHER);

        biomassBalance.push(agentBiomass.balanceHistory[i]);
        
    
        let biomassVolumeTemp = 0;

        for( let j=0; j < agentBiomass.askHistory.length; j++  ){
            if(agentBiomass.askHistory[j].timeRow == i ) {

                biomassAskGasTemp.push( agentBiomass.askHistory[j].transactionCost );
            }
            else{
                biomassAskGasTemp.push( 0 );
            }
            
        }
        for( let j=0; j < agentBiomass.successfulAskHistory.length; j++  ){
            if( agentBiomass.successfulAskHistory[j].timeRow == i){
                biomassVolumeTemp += agentBiomass.successfulAskHistory[j].amount;
            } 
        }
        if(biomassVolumeTemp == 0){
            biomassAskAmount.push(0);
        }
        else{
            let costEther = biomassVolumeTemp / WEI_IN_ETHER;
            let costPounds = costEther * ( parseFloat(PRICE_OF_ETHER.toFixed(18)));
            costPounds = parseFloat(costPounds.toFixed(3));
            biomassAskAmount.push(costPounds);
        }
        //calculate volume biomass
        biomassVolumePounds.push( biomassAskAmount[i]);
        biomassAskGas.push( convertArrayGasToPounds(biomassAskGasTemp, GASPRICE, WEI_IN_ETHER, PRICE_OF_ETHER));
        

        for (let j = 0; j < agentsBattery.length; j++) {

            demand.push(agentsBattery[j].agent.historicalDemand[i].demand);
            supply.push(agentsBattery[j].agent.historicalSupply[i].supply);

            agentsBalanceHistoryAgent.push( convertWeiToPounds(agentsBattery[j].agent.balanceHistoryAgent[i], WEI_IN_ETHER, PRICE_OF_ETHER) );
            agentsBalanceHistoryContract.push( convertWeiToPounds(agentsBattery[j].agent.balanceHistoryContract[i], WEI_IN_ETHER, PRICE_OF_ETHER))

            for(let k = 0; k < agentsBattery[j].agent.chargeHistory.length; k++ ) {

                if( agentsBattery[j].agent.chargeHistory[k].timeRow == i){
                    charge.push(agentsBattery[j].agent.chargeHistory[k].charge);
                }
                else {
                    charge.push(0);
                }
            }
            console.log('charge array', charge);

       
            for(let k = 0; k < agentsBattery[j].agent.costTransactions.length; k++) {
                if( agentsBattery[j].agent.costTransactions[k].timeRow == i){
                    contractInteractionCosts.push(agentsBattery[j].agent.costTransactions[k].transactionCost);
                }
                else {
                    contractInteractionCosts.push(0);
                }
            }

             //get black out occurances
            for(let k = 0; k < agentsBattery[j].agent.blackOutTimes.length; k++ ) {

                if( agentsBattery[j].agent.blackOutTimes[k].timeRow == i){
                    blackOutInstances.push(agentsBattery[j].agent.blackOutTimes[k].blackOut);
                }
                else {
                    blackOutInstances.push(0);
                }
            }

            //get Bids from bid history
            for(let k = 0; k < agentsBattery[j].agent.bidHistory.length; k++ ) {

                if( agentsBattery[j].agent.bidHistory[k].timeRow == i){
                    gasCostBids.push(agentsBattery[j].agent.bidHistory[k].transactionCost);
                }
                // else {
                //     gasCostBids.push(0);
                // }
            }
            
            //get ask history
            for(let z=0; z < agentsBattery[j].agent.askHistory.length; z++) {

                if( agentsBattery[j].agent.askHistory[z].timeRow == i){
                    gasCostAsks.push(agentsBattery[j].agent.askHistory[z].transactionCost);
                }
                // else{
                //     gasCostAsks.push(0);
                // }
            }

            

            //get bids that were successful 
            for(let k = 0; k < agentsBattery[j].agent.successfulBidHistory.length; k++) {
                if ( agentsBattery[j].agent.successfulBidHistory[k].timeRow == i) {
                successfulBidsElect.push(agentsBattery[j].agent.successfulBidHistory[k].quantity);
                successfulBidsGas.push(agentsBattery[j].agent.successfulBidHistory[k].transactionCost);
                successfulBidsAmount.push(agentsBattery[j].agent.successfulBidHistory[k].transactionAmount);
                succesfulBidsSumCosts.push(convertGasToPounds(agentsBattery[j].agent.successfulBidHistory[k].transactionCost, GASPRICE, WEI_IN_ETHER, PRICE_OF_ETHER));
                succesfulBidsSumCosts.push(convertWeiToPounds(agentsBattery[j].agent.successfulBidHistory[k].transactionAmount, WEI_IN_ETHER, PRICE_OF_ETHER));
                
                if(agentsBattery[j].agent.successfulBidHistory[k].receiver == biomassAddress) {
                    biomassBidsElect.push(agentsBattery[j].agent.successfulBidHistory[k].quantity)    
                }
                }
            }

            //get NationalGrid Purchases
            for(let k=0; k < agentsBattery[j].agent.nationalGridPurchases.length; k++) {
                if ( agentsBattery[j].agent.nationalGridPurchases[k].timeRow == i) {
                    console.log('national grid purchases volume', agentsBattery[j].agent.nationalGridPurchases[k].quantity);
                    nationalGridBidsQuantity.push(agentsBattery[j].agent.nationalGridPurchases[k].quantity);
                    nationalGridBidsAmount.push(agentsBattery[j].agent.nationalGridPurchases[k].transactionAmount);
                    nationalGridBidsGas.push(agentsBattery[j].agent.nationalGridPurchases[k].transactionCost);
                    nationalGridSumCosts.push(convertGasToPounds(agentsBattery[j].agent.nationalGridPurchases[k].transactionCost, GASPRICE, WEI_IN_ETHER, PRICE_OF_ETHER));
                    nationalGridSumCosts.push(convertWeiToPounds(agentsBattery[j].agent.nationalGridPurchases[k].transactionAmount, WEI_IN_ETHER, PRICE_OF_ETHER));
                }
            }
        }

        //Calculations to store the results for plots

        //calculations for the bids
        if(gasCostBids.length > 0) {
            if (gasCostBids == undefined) {
                gasCostBids = transactionCostBid [i-1];
            }
            let bidCostPounds = convertArrayGasToPounds(gasCostBids, GASPRICE, WEI_IN_ETHER, PRICE_OF_ETHER);
            transactionCostBid[i] = bidCostPounds;
        }
        else if(gasCostBids.length == 0) {
            transactionCostBid[i] = 0;
        }

        //calculation for the asks
        if(gasCostAsks.length > 0) {
            let askCostPounds = convertArrayGasToPounds(gasCostAsks, GASPRICE, WEI_IN_ETHER, PRICE_OF_ETHER);
            transactionCostAsk[i] = askCostPounds;
        }
        else if(gasCostAsks.length == 0) {
            transactionCostAsk[i] = 0;
        }

        if(contractInteractionCosts.length > 0) {
            chargeDischargeTXCosts.push( convertArrayGasToPounds(contractInteractionCosts, GASPRICE, WEI_IN_ETHER, PRICE_OF_ETHER) );
        }else if (contractInteractionCosts.length == 0) {
            chargeDischargeTXCosts.push(0);
        }
        //Some random time steps,a Nan appears, hence this loop
        // for(let j = 0; j < transactionCostAsk.length; j++) {
        //     if(isNaN(transactionCostAsk[j])) {
        //         transactionCostAsk[j] = 0;
        //     }
        // }
     
        transactionCostAvg.push((transactionCostAsk[i] + transactionCostBid[i] + chargeDischargeTXCosts[i] ) / (gasCostAsks.length + gasCostBids.length + contractInteractionCosts.length) );
        transactionCosts.push(transactionCostAsk[i] + transactionCostBid[i] + chargeDischargeTXCosts[i] ); //+ biomassAskGas[i]
        
        //calc for successful bids (the ones actually went through where there was a transaction of ether)
        if(successfulBidsGas.length > 0) {
            let succesfulBidsSumCostsPounds = succesfulBidsSumCosts.reduce((a, b) => a + b, 0);
            let bidsAmountPoundsAveraged =  convertArrayWeiToPounds(successfulBidsAmount, WEI_IN_ETHER, PRICE_OF_ETHER);
            let bidsGasPoundsAveraged =  convertArrayGasToPounds(successfulBidsGas, GASPRICE, WEI_IN_ETHER, PRICE_OF_ETHER);
            successfulBidsTotalCost[i] = succesfulBidsSumCostsPounds;
            successfulBidsAggAmount[i] = bidsAmountPoundsAveraged;
            successfulBidsAggGas[i] = bidsGasPoundsAveraged;
            tradingVolumeElect.push(successfulBidsElect.reduce((a, b) => a + b, 0));
            biomassVolumeElect.push(biomassBidsElect.reduce((a, b) => a + b, 0));
        }
        else if (successfulBidsGas == 0) {
            successfulBidsTotalCost[i] = 0;
            successfulBidsAggAmount[i] = 0;
            successfulBidsAggGas[i] = 0;
            tradingVolumeElect.push(0);
            biomassVolumeElect.push(0);
        }
        console.log('trading volume elect', tradingVolumeElect[i]);

        //calc the national grid purchases, amount, gas consumed and frequency
        if(nationalGridBidsGas.length > 0) {
            let nationalGridSumCostsPounds = nationalGridSumCosts.reduce((a, b) => a + b, 0);
            let nationalGridBidsAmountPounds =  convertArrayWeiToPounds(nationalGridBidsAmount, WEI_IN_ETHER, PRICE_OF_ETHER);
            let nationalGridBidsGasPounds =  convertArrayGasToPounds(nationalGridBidsGas, GASPRICE, WEI_IN_ETHER, PRICE_OF_ETHER);
            nationalGridBidsAggAmount[i] = nationalGridBidsAmountPounds;
            nationalGridBidsAggGas[i] = nationalGridBidsGasPounds;
            nationalGridTotalCost[i] = nationalGridSumCostsPounds;
            nationalGridVolumeElect.push( nationalGridBidsQuantity.reduce((a, b) => a + b, 0));

            averageNationalGridPurchases[i] = nationalGridBidsGas.length / agentsBattery.length;
            nationalGridPurchases[i] = nationalGridBidsGas.length;
        }
        else if(nationalGridBidsGas.length == 0) {
            nationalGridPurchases[i] = 0;
            nationalGridBidsAggAmount[i] = 0;
            nationalGridBidsAggGas[i] = 0;
            averageNationalGridPurchases[i] =0;
            nationalGridTotalCost[i] = 0;
            nationalGridVolumeElect.push(0);
        }

        //calculate sum of transactions
        let sumTransactions = gasCostAsks.length + gasCostBids.length + contractInteractionCosts.length ;
        totalNumberTransactions.push(sumTransactions);
        let numberMarketTransactions = amountSuccessFulBids[i];
        averageNumberTransactions.push(totalNumberTransactions[i] / agentsBattery.length);
        
        if(successfulBidsGas.length > 0 && nationalGridBidsGas.length > 0) {
            percentageNatGridEnergyTrades.push( (nationalGridBidsGas.length / successfulBidsGas.length ) * 100 );
        } else if( successfulBidsGas.length > 0 && nationalGridBidsGas.length == 0) {
            percentageNatGridEnergyTrades.push(0);
        }
        else if( successfulBidsGas.length == 0) {
            percentageNatGridEnergyTrades.push(0);
        }

        //suming up demand, supply and amount of aggregated charge
        const sumDemand = demand.reduce((a, b) => a + b, 0);
        const sumSupply = supply.reduce((a, b) => a + b, 0);
        const sumCharge = charge.reduce((a, b) => a + b, 0);
        
        aggregatedDemand[i] = sumDemand;
        aggregatedSupply[i] = sumSupply;
        aggActualDemand[i] = sumDemand - sumSupply;
        chargeHistoryAggregated.push( sumCharge );

        //agent balance averaged - history
        agentBalanceAverageAgent.push( (agentsBalanceHistoryAgent.reduce((a, b) => a + b, 0)) / agentsBattery.length );
        agentBalanceAverageContract.push(agentsBalanceHistoryContract.reduce((a, b) => a + b, 0) / agentsBattery.length);

        agentExpenditureTotal.push( agentBalanceAverageAgent[i] + agentBalanceAverageContract[i]);

        
        if(agentBalanceAverageAgent.length > 0) {
            hourlyExpenditureGas[i] = agentBalanceAverageAgent[i-1] - agentBalanceAverageAgent[i];
            hourlyExpenditureTrade[i] = agentBalanceAverageContract[i-1] - agentBalanceAverageContract[i];
            hourlyExpenditure[i] = hourlyExpenditureGas[i] + hourlyExpenditureTrade[i];
        }
       
        //calculate day averages
        if( i > 0){
            if(i % 24 == 0) {  
                let initialAverageBalance = 0;
                let finalAverageBalance = 0;
                let calcAverageTransactions = new Array();
                let calcAverageNatGridPurchases = new Array();
                let calcAverageBalanceDay = new Array();
                let calcAverageAsksDay = new Array();
                let calcAverageBidsDay = new Array();
                let calcTradingVolume = new Array();
                let calcNationalGridTransactionDay = new Array();

                for (let j = i - 24; j < i; j++){

                    calcAverageTransactions[j] = averageNumberTransactions[j];
                    calcAverageNatGridPurchases[j] = averageNationalGridPurchases[j];
                    calcNationalGridTransactionDay[j] = nationalGridPurchases[i];
                    calcTradingVolume[j] = successfulBidsAggAmount[j];

                    if(j == i - 24) {
                        initialAverageBalance = agentExpenditureTotal[j];
                    }

                    if(j == i - 1) {
                        finalAverageBalance= agentExpenditureTotal[j];
                    }

                    let dayAverageExpenditure = Math.abs(finalAverageBalance - initialAverageBalance);
    
                    if(finalAverageBalance != null){
                        averageExpenditureDay[i] = dayAverageExpenditure;
                    }
                    else if (finalAverageBalance == null){
                        averageExpenditureDay[i] = 0;
                    }
                }
                nationalGridPurchasesDay[i] = calcNationalGridTransactionDay.reduce((a, b) => a + b, 0);
                dailyVolume[i] = calcTradingVolume.reduce((a, b) => a + b, 0);
                averageNumberTransactionsDay[i] = calcAverageTransactions.reduce((a, b) => a + b, 0);
                averageNationalGridPurchasesDay[i] = calcAverageNatGridPurchases.reduce((a, b) => a + b, 0);
                averageAsksDay[i] = (calcAverageAsksDay.reduce((a, b) => a + b, 0))/ agentsBattery.length;
                averageBidsDay[i] = (calcAverageBidsDay.reduce((a, b) => a + b, 0)) / agentsBattery.length;
            }
        }
        
        //clean up arrays from empty values
        averageNationalGridPurchasesDay = Array.from(averageNationalGridPurchasesDay, item => item || 0);
        averageAsksDay = Array.from(averageAsksDay, item => item || 0);
        averageBidsDay = Array.from(averageBidsDay, item => item || 0);
        averageExpenditureDay = Array.from(averageExpenditureDay, item => item || 0);
        averageNumberTransactionsDay = Array.from(averageNumberTransactionsDay, item => item || 0);
        dailyVolume = Array.from(dailyVolume, item => item || 0);

        biomassContractBalanceHistory[i] = convertWeiToPounds(biomassContractBalanceHistory[i], WEI_IN_ETHER, PRICE_OF_ETHER);
        biomassContractBalanceHourly.push(biomassContractBalanceHistory[i] - biomassContractBalanceHistory[i-1])
        let newCsvEntry = {
            time: i,
            agg_demand: aggregatedDemand[i],
            agg_supply: aggregatedSupply[i],
            agg_actual_demand: aggActualDemand[i],
            historical_prices: succesfulBidsPrice[i],
            cost_transaction: transactionCostAvg[i],
            total_transaction_cost: transactionCosts[i],
            total_trading_volume: succesfulBidsTransactionAmount[i],
            biomass_volume: biomassContractBalanceHourly[i],
            nat_grid_volume: nationalGridBidsAggAmount[i],
            trading_volume_elect: succesfulBidsQuantity[i],
            biomass_volume_elect: biomassVolumeElect[i],
            nat_grid_volume_elect: nationalGridVolumeElect[i],
            no_total_transactions: totalNumberTransactions[i],
            no_trades_market:  amountSuccessFulBids[i],
            no_market_transactions: numberMarketTransactions,
            no_nat_grid_transactions: nationalGridBidsGas.length,
            no_bids: gasCostBids.length,
            no_asks: gasCostAsks.length + biomassAskGasTemp.length,
            no_bids_market: bidCount,
            no_asks_market: askCount,
            charge_history_agg: chargeHistoryAggregated[i],
            avg_expenditure_hourly: hourlyExpenditure[i],
            avg_trade_volume : agentBalanceAverageContract[i],
            avg_transaction_expenditure: agentBalanceAverageAgent[i],
            avg_transactions_hourly: averageNumberTransactions[i],
            avg_bids_day: averageBidsDay[i],
            avg_asks_day: averageAsksDay[i],
            avg_cost_day_agent: averageExpenditureDay[i],
            avg_nat_grid_purchases_day: averageNationalGridPurchasesDay[i],
            nat_grid_purchases_day: nationalGridPurchasesDay[i],
            avg_transactions_hourly: averageNumberTransactionsDay[i],
            trading_daily_volume: dailyVolume[i],
            percentage_Market_Trades: percentageNatGridEnergyTrades[i],
            black_Out_Instances: blackOutInstances[i]

        }
        csvData.push(newCsvEntry);
    }
    console.log(`writing results of simulation to csv file : ${csvResultsFileName}`);

    var csvStream = csv.createWriteStream({ headers: true }),
    writableStream = fs.createWriteStream(csvResultsFileName);

    writableStream.on("finish", function () {
        console.log("DONE!");
    });
    
    csvStream.pipe(writableStream);
    for(let i = 0; i < csvData.length; i++){
    csvStream.write(csvData[i]);
    }
    csvStream.end();

    // var trace1 = {
    //     x: timeArray,
    //     y: historicalPricesPlot,
    //     name: "Historical Prices (p/kWh)",
    //     yaxis: "y1",
    //     type: "scatter"
    // }
    // var trace2 = {
    //     x: timeArray,
    //     y: aggregatedDemand,
    //     name: "Aggregated Demand (Wh)",
    //     yaxis: "y2",
    //     type: "scatter"
    // }
    // var trace3 = {
    //     x: timeArray,
    //     y: aggregatedSupply,
    //     name: "Aggregated Supply (Wh)",
    //     yaxis: "y2",
    //     type: "scatter"
    // }
    // var trace4 = {
    //     x: timeArray,
    //     y: biomassBalanceHistory,
    //     name: "biomass Balance History",
    //     yaxis: "y3",
    //     type: "scatter"
    // }
    // var trace5 = {
    //     x: timeArray,
    //     y: chargeHistoryAggregated,
    //     name: "Charge history aggregated",
    //     yaxis: "y2",
    //     type: "scatter"
    // }
    // var trace6 = {
    //     x: timeArray,
    //     y: biomassAskAmount,
    //     name: "Biomass Volume",
    //     yaxis: "y3",
    //     type: "scatter"
    // }
    // var data = [trace1, trace2, trace3, trace4, trace5, trace6];
    // var layout = {
    //     title: "Day Simulation - Agents with Batteries",
    //     xaxis: {domain: [0.1, 0.85]},
    //     yaxis: {title: "Price (p/kWh)"},
    //     yaxis2: {
    //       title: "Energy (Wh)",
    //       titlefont: {color: "rgb(148, 103, 189)"},
    //       tickfont: {color: "rgb(148, 103, 189)"},
    //       overlaying: "y",
    //       side: "right",
    //       anchor: "x"
    //     },
    //     yaxis3: {
    //         title: "Gas",
    //         titlefont: {color: "#d62728"},
    //         tickfont: {color: "#d62728"},
    //         anchor: "x",
    //         overlaying: "y",
    //         side: "left",
    //         anchor: "free",
    //         position: 0,
    //         showgrid: false
    //     }
    //     // yaxis4: {
        //     title: "# Transactions",
        //     titlefont: {color: "#d62728"},
        //     tickfont: {color: "#d62728"},
        //     anchor: "x",
        //     overlaying: "y",
        //     side: "left",
        //     anchor: "free",
        //     position: 1,
        //     showgrid: false
        // }
    //};

    // var graphOptions = {layout: layout, filename: "Day Simulation - agents with batteries (including biomass)", fileopt: "overwrite"};
    // plotly.plot(data, graphOptions, function (err, msg) {
    //     console.log(msg);
    // });

};

init();

function standardDeviation(values){
    var avg = average(values);
    
    var squareDiffs = values.map(function(value){
      var diff = value - avg;
      var sqrDiff = diff * diff;
      return sqrDiff;
    });
    
    var avgSquareDiff = average(squareDiffs);
  
    var stdDev = Math.sqrt(avgSquareDiff);
    return stdDev;
}
  
function average(data){
    var sum = data.reduce(function(sum, value){
        return sum + value;
    }, 0);

    var avg = sum / data.length;
    return avg;
}

async function loadData(inputFile){
    let resultSet = await readCSV(inputFile);
    return resultSet;
}

function deleteRow(arr, row) {
    arr = arr.slice(0); // make copy
    arr.splice(row, 1);
    return arr;
}

async function getFiles() {
    console.log('reading files...');
    let householdFiles = new Array();
    let householdHistoricData = new Array();
    let metaData= await loadData(inputFile);

    metaData = deleteRow(metaData, 0);// remove header of file

    for (i = 0; i < metaData.length; i++){
            id.push( metaData[i][0] );
            baseValue.push( metaData[i][2] );
            baseValueBattery.push( metaData[i][3] );
            householdFiles.push(`../data/household_${id[i]}.csv`); // `householdFile
    }

    for (const file of householdFiles){
        householdHistoricData.push( await loadData(file));
    }
    return { metaData, householdHistoricData};
}

async function createAgents(metaData, householdHistoricData, biomassData, batteryCapacity, batteryBool, BIOMASS_PRICE_MIN, BIOMASS_PRICE_MAX) {
    console.log('creating agents...');
    let agents = new Array();
    let agentNationalGrid = new AgentNationalGrid();
    let agentBiomass = new AgentBiomass(BIOMASS_PRICE_MIN, BIOMASS_PRICE_MAX);

    agentBiomass.loadData(biomassData);

        for (const item in metaData){

        //creation of agents and feeding the data in
        agent = new Agent(batteryCapacity, batteryBool); //no battery capacity passed
        
        agentAccount = await agent.getAccount(item);
        
        //household = await agent.deployContract();
        
        await agent.loadSmartMeterData(householdHistoricData[item], baseValue[item], baseValueBattery[item], id [item]);
        let newAgent = {
            id: id[item],
            agent,
            agentAccount
        }
        agents.push(newAgent);      
        }
    return { agents, agentNationalGrid,agentBiomass };
}

async function getExchangeBids() {
    let bids = new Array();
    let asks = new Array();
    let bid = 0;
    let ask = 0;
    let bidsVolumeElect = new Array();
    let asksVolumeElect = new Array();

    let bidsCount = await exchange.methods.getBidsCount().call();
    let asksCount = await exchange.methods.getAsksCount().call();

    for (let i = 0; i <= bidsCount - 1 ; i++){
        bid = await exchange.methods.getBid(i).call();

        let date = new Date(parseInt(bid[3]));
        date = date.toLocaleString();
        newBid = {
            price: parseInt(bid[1]),
            amount: parseInt(bid[2]),
            address: bid[0],
            date: date
        }
        bids.push(newBid);
        bidsVolumeElect.push( parseInt(bid[2]) );
    }
    for (let j = 0; j <= asksCount - 1; j++){
        try {
            ask = await exchange.methods.getAsk(j).call();
        } catch(err){
            console.log('ERROR', err);
        }

        let date = new Date(parseInt(ask[3]));
        date = date.toLocaleString();

        newAsk = {
            price: parseInt(ask[1]),
            amount: parseInt(ask[2]),
            address: ask[0],
            date: date
        }
        asks.push(newAsk);
        asksVolumeElect.push( parseInt(ask[2]) );
    }
    return { bids, asks , bidsVolumeElect, asksVolumeElect};
}

//decreasing amount
function sortByAmount(a, b) {
    if (a.amount === b.amount) {
        return 0;
    }
    else {
        return (a.amount > b.amount) ? -1 : 1;
    }
}

async function clearMarket() {
    let bidsCount = await exchange.methods.getBidsCount().call();
    let asksCount = await exchange.methods.getAsksCount().call();
    let accounts = await web3.eth.getAccounts();

    for (let i = bidsCount - 1; i >= 0; i--) {
        await exchange.methods.removeBid(i).send({
            from: accounts[accounts.length-1],
            gas: '2000000'
        });
        bidsCount = await exchange.methods.getBidsCount().call();
    }
    for (let i = asksCount - 1; i >= 0; i--) {
        await exchange.methods.removeAsk(i).send({
            from: accounts[accounts.length-1],
            gas: '2000000'
        });
        asksCount = await exchange.methods.getAsksCount().call();
    }
    
    bidsCount = await exchange.methods.getBidsCount().call();
    asksCount = await exchange.methods.getAsksCount().call();

}


function findMatch() {
    let temp = new Array();
    let matchingOrders = new Array();
    let nonMatchedBids = new Array();
    let nonMatchedAsks = new Array();
    for(let i=0; i < bids.length; i++) {
        for(let j=0; j < asks.length; j++) {
            temp[j] = Math.abs(bids[i][0] - asks[j][0]);
        }
        let minimumIndex = indexOfSmallest(temp);
        matchingOrders.push(new Array(bids[i], asks[minimumIndex]));
    }
   
    for(let j=0; j < bids.length; j++){
        if ( matchingOrders.includes(bids[j]) == false){
            nonMatchedBids = bids[j];
        }
    }

    for(let j=0; j < asks.length; j++){
        if ( matchingOrders.includes(asks[j]) == false){
            nonMatchedAsks = asks[j];
        }
    }

    
    return 
}

function indexOfSmallest(a) {
    var lowest = 0;
    for (var i = 1; i < a.length; i++) {
     if (a[i] < a[lowest]) lowest = i;
    }
    return lowest;
}

function removeFirsRow(householdHistoricData) { 
    let tempArray = new Array();
   
       for(let i = 1; i < householdHistoricData.length; i++) {
           tempArray.push(householdHistoricData[i])
       }
   
    return tempArray;
   }
   
function generateBiomassData(householdHistoricData) {
    let biomassData = Array(householdHistoricData[0].length).fill(0);
    
    for(let i = 0; i < householdHistoricData.length; i++) {

    
        let singleHousehold = removeFirsRow(householdHistoricData[i]);

        for(let j = 0; j < singleHousehold.length; j++) {

            biomassData[j] += singleHousehold[j][1] * 0.6; //satisfy 90% of their needs

        }
    }
    return biomassData;
}