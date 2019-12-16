//requirements
//Using ganache
// const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
web3 = new Web3( new Web3.providers.HttpProvider("http://localhost:8545"))
const Agent = require('../models/agentSimulation.js');
const AgentNationalGrid = require('../models/agentNationalGrid.js');
const plotly = require('plotly')("guibvieira", "oI36xfxoUbcdc5XR0pEK");

//compiled contracts
//const factory = require('../ethereum/factory');
const exchange = require('../ethereum/exchange');

//packages and functions imports
const readCSV = require('./readFile.js');
let fs = require('fs');
var csv = require("fast-csv");
let parse = require('csv-parse');
let async = require('async');
let calculateIntersection = require('./intersection');
let inputFile = '../data/metadata-LCOE.csv';
let id = [];
let baseValue = [];
let baseValueBattery = [];

let agentsNoBattery = [];
let agentsBattery = [];




//customisable variables for Simulation
const GASPRICE = 2000000000; //wei
const simulationDays = 1; //input
const priceOfEther = 250;
const NATIONAL_GRID_PRICE = 0.1437; //input
const WEI_IN_ETHER = 1000000000000000000;
const csvResultsFileName = 'output.csv'; //input

async function init() {
    let unFilledBids = [];
    let unFilledAsks = [];
    let aggregatedDemand = [];
    let aggregatedSupply = [];
    let historicalPricesPlot = [];

    var accounts = await web3.eth.getAccounts();

    let { metaData, householdHistoricData } = await getFiles();

    let metaDataBattery = metaData.slice(0, Math.floor(metaData.length / 2));
    //let metaDataNoBattery = metaData.slice( Math.floor(metaData.length)/2 , metaData.length-1 );

    let householdDataBattery = householdHistoricData.slice(0, Math.floor(householdHistoricData.length) / 2 );
    //let householdDataNoBattery = householdHistoricData.slice(Math.floor(householdHistoricData.length)/2, householdHistoricData.length-1);

    //AGENTS BATTERY DOESN'T WORK BUT AGENT NATIONAL GRID DOES
    let { agents, agentNationalGrid } = await createAgents(metaDataBattery, householdDataBattery, 12000, true);
    //let agentsNoBattery =  await createAgents(metaDataNoBattery, householdDataNoBattery, 0, false);
    let agentsBattery = agents;

    let simulationDurationCalc = 365 / simulationDays;
    let simDuration = householdHistoricData[0].length / Math.round(simulationDurationCalc);    //start simulation
    
    simDuration = Math.round(simDuration);
    let timeArray= [];
    console.log('sim duration', simDuration);
    console.log('starting simulation');

    for (let i= 0; i < simDuration; i++) {
        timeArray.push(i);
        console.log('time', i);

        let nationalGridAddress = await agentNationalGrid.getAccount(accounts.length-1); // make the last account from ganache to be the national grid address
        await agentNationalGrid.getAgentBalance(); //initialise the balance count
        
        for (let j = 0; j < agentsBattery.length; j++){

            agentsBattery[j].agent.setCurrentTime(i);
            agentsBattery[j].agent.setAgentBalance();

            if( i == 0) {
                await agentsBattery[j].agent.setNationalGrid(NATIONAL_GRID_PRICE, nationalGridAddress);
            }
           
            try{
                await agentsBattery[j].agent.purchaseLogic();
            } catch(err){
                console.log('error from purchase logic', err);
            }
        }
        let { bids, asks } = await getExchangeBids();


        //Decide on price and make transactions to respective receivers
        if (bids.length >= 2  && asks.length  >= 2 ){        
            let intersection = calculateIntersection(bids, asks); //first is price, next is amount, lastly address
            let acceptedBids = [];
            let acceptedAsks = [];
            let paidBids = [];

            bids = bids.sort(sortByAmount);
            asks = asks.sort(sortByAmount);
          
            //uncommenct for when only portion of bids and asks are to be accetped
            // for(let i = 0; i< bids.length; i++){
            //     if (bids[i].amount < intersection[0]){
            //         acceptedBids.push(bids[i]);
            //     }
            // }
            // for(let i = 0; i< asks.length; i++){
            //     if (asks[i][0] < intersection[0]){
            //         acceptedAsks.push(asks[i]);
            //     }
            // }
            //console.log('accepted asks', acceptedAsks);

            //populate every agent with the closing price for this time step
            for (let j = 0; j < agentsBattery.length; j++) {
                agentsBattery[j].agent.historicalPrices[i] = intersection[1];
            }

            for(let i=0; i < asks.length; i++) {
                let obj = agentsBattery.find(function (obj) { return obj.agentAccount === bids[i].address; });
                paidBids.push(obj);
                confirmation = await obj.agent.sendFunds(intersection[1], asks[i].amount, asks[i].address );
                obj.agent.charge(asks[i].amount);

                let objSeller = agentsBattery.find(function (obj) { return obj.agentAccount === asks[i].address; });
                objSeller.agent.discharge(asks[i].amount);
                objSeller.agent.addSuccessfulAsk(asks[i].amount);
                
            }

            let localUnfilledBids = bids.filter( el => {
                if (paidBids.indexOf( el ) < 0) {
                    return el.address;
                }
            });

            if(localUnfilledBids.length > 0){
                for (let i=0; i < localUnfilledBids.length; i++){
                    let obj = agentsBattery.find(function (obj) { return obj.agentAccount === localUnfilledBids[i].address; });
                    obj.agent.discharge(localUnfilledBids[i].amount);
                    unFilledBids.push(localUnfilledBids[i]);
                }
            }

            await clearMarket();
        }
        else if (bids.length < 2  || asks.length  < 2) {
            //if there isn't enough asks and bids to formulate a closing price, 
            //make sure to notify agents that their bids didn't go through and therefore need to charge or discharge their batteries
            for (let i=0; i < bids.length; i++){
                unFilledBids.push(bids[i]);
                let obj = agentsBattery.find(function (obj) { return obj.agentAccount === bids[i].address; });
                obj.agent.discharge(bids[i].amount);
            }
            for (let i=0; i < asks.length; i++) {
                unFilledAsks.push(asks[i]);
                let obj = agentsBattery.find(function (obj) { return obj.agentAccount === asks[i].address; });
                obj.agent.charge(asks[i].amount);
            }
            for (let j = 0; j < agentsBattery.length; j++) {
                agentsBattery[j].agent.historicalPrices[i] = 0; //no trade was done on this time slot, therefore attribute 0
            }

            await clearMarket();
        }
        

    }

    let agentBalanceAverage = [];
    
    let history = agentsBattery[0].agent.historicalPrices;
    let aggActualDemand =  [];
    let chargeHistoryAggregated = [];
    let transactionCostBid = [];
    let transactionCostAsk = [];
    let transactionCostAvg = [];
    let amountBidsPerT = [];
    let amountAsksPerT = [];
    let nationalGridBidsAggAmount= [];
    let nationalGridBidsAggGas = [];
    let nationalGridPurchases = [];
    let nationalGridTotalCost = [];
    let totalNumberTransactions = [];
    let successfulBidsAggAmount = [];
    let successfulBidsAggGas = [];
    let successfulBidsTotalCost = [];
    let percentageMarketEnergyTrades = [];
    let dailyVolume = [];
    let blackOutInstances = [];
    let hourlyExpenditure = [];

    //averages parameters (for each agent)
    let averageNumberTransactions = [];
    let averageNumberTransactionsDay = [];
    let averageNationalGridPurchases = []; 
    let averageNationalGridPurchasesDay = []; 
    let averageExpenditureDay = [];
    let averageAsksDay = [];
    let averageBidsDay = [];


    let simulationCSV = [];
    let csvData = [];
    

    const sumPrices= history.reduce((a, b) => a + b, 0);
    const averagePrices = sumPrices/simDuration;
    console.log('average of prices', averagePrices);
    console.log('sim duration', simDuration);

    //Calculating Parameters from simulation to plot
    //
    for (let i = 0; i < simDuration; i++) {
        let demand = [];
        let supply = [];
        let charge = [];
        let gasCostBids = [];
        let gasCostAsks = [];
        let nationalGridBidsGas = [];
        let nationalGridBidsAmount = [];
        let nationalGridSumCosts = [];
        let successfulBidsGas = [];
        let successfulBidsAmount = [];
        let succesfulBidsSumCosts = [];
        let agentsBalanceHistory = [];


        //conversion from wei to pounds
        historicalPricesPlot[i] = convertWeiToPounds(agentsBattery[0].agent.historicalPrices[i]);

        for (let j = 0; j < agentsBattery.length; j++) {
            demand.push(agentsBattery[j].agent.historicalDemand[i].demand);
            supply.push(agentsBattery[j].agent.historicalSupply[i].supply);

            agentsBalanceHistory.push( convertWeiToPounds(agentsBattery[j].agent.balanceHistory[i]) );

            //fill the empty time slots with zeros for ploting
            if(agentsBattery[j].agent.chargeHistory[i] == null ) {
                charge.push(0);
            }
            else if(agentsBattery[j].agent.chargeHistory[i] != null) {
                charge.push(agentsBattery[j].agent.chargeHistory[i]);
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
                successfulBidsGas.push(agentsBattery[j].agent.successfulBidHistory[k].transactionCost);
                successfulBidsAmount.push(agentsBattery[j].agent.successfulBidHistory[k].transactionAmount);
                succesfulBidsSumCosts.push(convertGasToPounds(agentsBattery[j].agent.successfulBidHistory[k].transactionCost));
                succesfulBidsSumCosts.push(convertWeiToPounds(agentsBattery[j].agent.successfulBidHistory[k].transactionAmount));
                }
            }

            //get NationalGrid Purchases
            for(let k=0; k < agentsBattery[j].agent.nationalGridPurchases.length; k++) {
                if ( agentsBattery[j].agent.nationalGridPurchases[k].timeRow == i) {
                    nationalGridBidsAmount.push(agentsBattery[j].agent.nationalGridPurchases[k].transactionAmount);
                    nationalGridBidsGas.push(agentsBattery[j].agent.nationalGridPurchases[k].transactionCost);
                    nationalGridSumCosts.push(convertWeiToPounds(agentsBattery[j].agent.nationalGridPurchases[k].transactionAmount));
                    nationalGridSumCosts.push(convertGasToPounds(agentsBattery[j].agent.nationalGridPurchases[k].transactionCost));
                }
            }
        }

        //Calculations to store the results for plots

        //calculations for the bids
        if(gasCostBids.length > 0) {
            amountBidsPerT[i] = gasCostBids.length;
            if (gasCostBids == undefined) {
                gasCostBids = transactionCostBid [i-1];
            }
            let bidCostPounds = convertArrayGasToPounds(gasCostBids);
            transactionCostBid[i] = bidCostPounds;
        }
        else if(gasCostBids.length == 0) {
            transactionCostBid[i] = 0;
            amountBidsPerT[i] = 0;
        }

        //calculation for the asks
        if(gasCostAsks.length > 0) {
            amountAsksPerT[i] = gasCostAsks.length;
            let askCostPounds = await convertArrayGasToPounds(gasCostAsks);
            transactionCostAsk[i] = askCostPounds;
        }
        else if(gasCostAsks.length == 0) {
            transactionCostAsk[i] = 0;
            amountAsksPerT[i] = 0;
        }
     
        transactionCostAvg.push((transactionCostAsk[i] + transactionCostBid[i]) / (gasCostAsks.length + gasCostBids.length) );
        
        //calc for successful bids (the ones actually went through where there was a transaction of ether)
        if(successfulBidsGas.length > 0) {
            let succesfulBidsSumCostsPounds = succesfulBidsSumCosts.reduce((a, b) => a + b, 0);
            let bidsAmountPoundsAveraged = await convertArrayWeiToPounds(successfulBidsAmount);
            let bidsGasPoundsAveraged = await convertArrayGasToPounds(successfulBidsGas);
            successfulBidsTotalCost[i] = succesfulBidsSumCostsPounds;
            successfulBidsAggAmount[i] = bidsAmountPoundsAveraged;
            successfulBidsAggGas[i] = bidsGasPoundsAveraged;
        }
        else if (successfulBidsGas == 0) {
            successfulBidsTotalCost[i] = 0;
            successfulBidsAggAmount[i] = 0;
            successfulBidsAggGas[i] = 0;
        }

        //calc the national grid purchases, amount, gas consumed and frequency
        if(nationalGridBidsGas.length > 0) {
            let nationalGridSumCostsPounds = nationalGridSumCosts.reduce((a, b) => a + b, 0);
            let nationalGridBidsAmountPounds = await convertArrayWeiToPounds(nationalGridBidsAmount);
            let nationalGridBidsGasPounds = await convertArrayGasToPounds(nationalGridBidsGas);
            nationalGridBidsAggAmount[i] = nationalGridBidsAmountPounds;
            nationalGridBidsAggGas[i] = nationalGridBidsGasPounds;
            nationalGridTotalCost[i] = nationalGridSumCostsPounds;

            averageNationalGridPurchases[i] = nationalGridBidsGas.length / agentsBattery.length;
            nationalGridPurchases[i] = nationalGridBidsGas.length;
        }
        else if(nationalGridBidsGas.length == 0) {
            nationalGridPurchases[i] = 0;
            nationalGridBidsAggAmount[i] = 0;
            nationalGridBidsAggGas[i] = 0;
            averageNationalGridPurchases[i] =0;
            nationalGridTotalCost[i] = 0;
        }

        //calculate sum of transactions
        let sumTransactions = nationalGridBidsGas.length + gasCostAsks.length + gasCostBids.length + successfulBidsGas.length;
        totalNumberTransactions.push(sumTransactions);
        let numberMarketTransactions = gasCostAsks.length + gasCostBids.length + successfulBidsGas.length;
        averageNumberTransactions.push(totalNumberTransactions[i] / agentsBattery.length);
        
        if(successfulBidsGas.length > 0) {
            percentageMarketEnergyTrades.push( (successfulBidsGas.length / nationalGridBidsGas.length) * 100 );
        }
        else if( successfulBidsGas.length == 0) {
            percentageMarketEnergyTrades.push(0);
        }

        //suming up demand, supply and amount of aggregated charge
        const sumDemand = demand.reduce((a, b) => a + b, 0);
        const sumSupply = supply.reduce((a, b) => a + b, 0);
        const sumCharge = charge.reduce((a, b) => a + b, 0);
        
        aggregatedDemand[i] = sumDemand;
        aggregatedSupply[i] = sumSupply;
        aggActualDemand[i] = sumDemand - sumSupply;
        chargeHistoryAggregated[i] = sumCharge;

        //agent balance averaged - history
        agentBalanceAverage.push( (agentsBalanceHistory.reduce((a, b) => a + b, 0)) / agentsBattery.length );
        
        if(agentBalanceAverage.length > 0) {
            hourlyExpenditure[i] = agentBalanceAverage[i-1] - agentBalanceAverage[i];
        }
       
        //calculate day averages
        if( i > 0){
            if(i % 24 == 0) {  
                let initialAverageBalance = 0;
                let finalAverageBalance = 0;
                let calcAverageTransactions = [];
                let calcAverageNatGridPurchases = [];
                let calcAverageBalanceDay = [];
                let calcAverageAsksDay = [];
                let calcAverageBidsDay = [];
                let calcTradingVolume = [];

                for (let j = i - 24; j < i; j++){

                    calcAverageTransactions[j] = averageNumberTransactions[j];
                    calcAverageNatGridPurchases[j] = averageNationalGridPurchases[j];
                    calcAverageAsksDay[j] = amountAsksPerT[j];
                    calcAverageBidsDay[j] = amountBidsPerT[j];
                    calcTradingVolume[j] = successfulBidsAggAmount[j];

                    if(j == i - 24) {
                        initialAverageBalance = agentBalanceAverage[j];
                    }

                    if(j == i - 1) {
                        finalAverageBalance= agentBalanceAverage[j];
                    }

                    let dayAverageExpenditure = Math.abs(finalAverageBalance - initialAverageBalance);
    
                    if(finalAverageBalance != null){
                        averageExpenditureDay[i] = dayAverageExpenditure;
                    }
                    else if (finalAverageBalance == null){
                        averageExpenditureDay[i] = 0;
                    }
                }

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

        

        let newCsvEntry = {
            time: i,
            agg_demand: aggregatedDemand[i],
            agg_supply: aggregatedSupply[i],
            agg_actual_demand: aggActualDemand[i],
            historical_prices: historicalPricesPlot[i],
            cost_transaction: transactionCostAvg[i],
            trading_volume: successfulBidsAggAmount[i],
            nat_grid_volume: nationalGridBidsAggAmount[i],
            no_total_transactions: totalNumberTransactions[i],
            no_trades_market:  successfulBidsGas.length,
            no_market_transactions: numberMarketTransactions,
            no_nat_grid_transactions: nationalGridBidsGas.length,
            no_bids_market: amountBidsPerT[i],
            no_asks_market: amountAsksPerT[i],
            charge_history_agg: chargeHistoryAggregated[i],
            hourly_expenditure: hourlyExpenditure[i],
            avg_expenditure_hourly: agentBalanceAverage[i],
            avg_transactions_day: averageNumberTransactions[i],
            avg_bids_agent: amountBidsPerT[i] / agentsBattery.length,
            avg_asks_agent: amountAsksPerT[i] / agentsBattery.length,
            avg_bids_day: averageBidsDay[i],
            avg_asks_day: averageAsksDay[i],
            avg_cost_day_agent: averageExpenditureDay[i],
            avg_nat_grid_purchases_day: averageNationalGridPurchasesDay[i],
            trading_daily_volume: dailyVolume[i],
            percentage_Market_Trades: percentageMarketEnergyTrades[i],
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

    var trace1 = {
        x: timeArray,
        y: historicalPricesPlot,
        name: "Historical Prices",
        yaxis: "y1",
        type: "scatter"
    }
    var trace2 = {
        x: timeArray,
        y: aggregatedDemand,
        name: "Aggregated Demand",
        yaxis: "y2",
        type: "scatter"
    }
    var trace3 = {
        x: timeArray,
        y: aggregatedSupply,
        name: "Aggregated Supply",
        yaxis: "y2",
        type: "scatter"
    }
    var trace4 = {
        x: timeArray,
        y: transactionCostBid,
        name: "Bid Transaction Cost",
        yaxis: "y3",
        type: "scatter"
    }
    var trace5 = {
        x: timeArray,
        y: transactionCostAsk,
        name: "Ask Transaction Cost",
        yaxis: "y3",
        type: "scatter"
    }
    var trace6 = {
        x: timeArray,
        y: amountBidsPerT,
        name: "# of Transactions",
        yaxis: "y4",
        type: "scatter"
    }
    var data = [trace1, trace2, trace3, trace4, trace5, trace6];
    var layout = {
        title: "Day Simulation - Agents with Batteries",
        xaxis: {domain: [0.1, 0.85]},
        yaxis: {title: "Price (p/kWh)"},
        yaxis2: {
          title: "Energy (Wh)",
          titlefont: {color: "rgb(148, 103, 189)"},
          tickfont: {color: "rgb(148, 103, 189)"},
          overlaying: "y",
          side: "right",
          anchor: "x"
        },
        yaxis3: {
            title: "Gas Cost (£)",
            titlefont: {color: "#d62728"},
            tickfont: {color: "#d62728"},
            anchor: "x",
            overlaying: "y",
            side: "left",
            anchor: "free",
            position: 0,
            showgrid: false
        },
        yaxis4: {
            title: "# Transactions",
            titlefont: {color: "#d62728"},
            tickfont: {color: "#d62728"},
            anchor: "x",
            overlaying: "y",
            side: "left",
            anchor: "free",
            position: 1,
            showgrid: false
        }
    };

    // var graphOptions = {layout: layout, filename: "Day Simulation - agents with batteries", fileopt: "overwrite"};
    // plotly.plot(data, graphOptions, function (err, msg) {
    //     console.log(msg);
    // });

};

init();

function convertArrayGasToPounds(array) {
    let sumCost = array.reduce((a, b) => a + b, 0);
    let costPerTransaction = sumCost / array.length;

    let calcPrice = costPerTransaction * GASPRICE;
    let costEther = calcPrice / WEI_IN_ETHER;
    let costPounds = costEther * (+ priceOfEther.toFixed(18));
    costPounds = + costPounds.toFixed(3);
    return costPounds;
}

function convertArrayWeiToPounds(arrayWei) {
    let sumCost = arrayWei.reduce((a, b) => a + b, 0);
    let costPerTransaction = sumCost / arrayWei.length;

    let costEther = costPerTransaction / WEI_IN_ETHER;
    let costPounds = costEther * (+ priceOfEther.toFixed(18));
    costPounds = + costPounds.toFixed(3);
    return costPounds;
}

function convertWeiToPounds(weiValue) {
    let costEther = weiValue / WEI_IN_ETHER;
    let costPounds = costEther * ( + priceOfEther.toFixed(18));
    costPounds = + costPounds.toFixed(3);
    return costPounds;
}

function convertGasToPounds(gasCost) {
    let calcPrice = gasCost * GASPRICE;
    let costEther = calcPrice / WEI_IN_ETHER;
    let costPounds = costEther * ( + priceOfEther.toFixed(18));
    costPounds = + costPounds.toFixed(3);
    return costPounds;
}

async function loadData(inputFile){
    let resultSet = await readCSV(inputFile);
    //console.log('resultset', resultSet);
    return resultSet;
}

function deleteRow(arr, row) {
    arr = arr.slice(0); // make copy
    arr.splice(row, 1);
    return arr;
 }

async function getFiles() {
    console.log('reading files...');
    let householdFiles = [];
    let householdHistoricData = [];
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

async function createAgents(metaData, householdHistoricData, batteryCapacity, batteryBool) {
    console.log('creating agents...');
    let agents = [];
    let agentNationalGrid = 0;

        for (const item in metaData){

        //creation of agents and feeding the data in
        agent = new Agent(batteryCapacity, batteryBool); //no battery capacity passed
        agentNationalGrid = new AgentNationalGrid();
        agentAccount = await agent.getAccount(item);
        
        //household = await agent.deployContract();
        
        await agent.loadSmartMeterData(householdHistoricData[item], baseValue[item], baseValueBattery[item], id [item]);
        let newAgent = {
            id: id [item ],
            agent,
            agentAccount
        }
        agents.push(newAgent);      
        }
    return { agents, agentNationalGrid };
}

async function getExchangeBids() {
    let bids = [];
    let asks = [];
    let bid = 0;
    let ask = 0;

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
    }
    return { bids, asks };
}

function sortByAmount(a, b) {
    if (a.amount === b.amount) {
        return 0;
    }
    else {
        return (a.amount < b.amount) ? -1 : 1;
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
    let temp = [];
    let matchingOrders = [];
    let nonMatchedBids = [];
    let nonMatchedAsks = [];
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