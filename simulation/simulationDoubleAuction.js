//requirements
//Using ganache
// const assert = require('assert');
const { writeDataToCSV, indexOfSmallest, removeFirsRow, generateBiomassData, clearMarket, findMatch, sortByAmount, loadData, getFiles, createAgents, getExchangeBids } = require('../utils/helpers');

const ganache = require('ganache-cli');
const Web3 = require('web3');
web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))
const Agent = require('../models/agentDoubleAuction.js');
const AgentNationalGrid = require('../models/agentNationalGrid.js');
const AgentBiomass = require('../models/agentBiomassDAuction.js');
const plotly = require('plotly')('guibvieiraProject', 'Whl2UptBOq1gMvQrRGHk');

//compiled contracts
const initHouseholdFactory = require('../ethereum/factory');
const initExchange = require('../ethereum/exchange');
const compiledHousehold = require('../ethereum/build/Household.json');

//packages and functions imports
const { convertArrayGasToPounds, convertArrayWeiToPounds, convertWeiToPounds, convertGasToPounds } = require('./conversions.js');

let inputFile = './data/metadata-LCOE.csv';



//customisable variables for Simulation
const GASPRICE = 2000000000; //wei
const simulationDays = 2;  // input
const PRICE_OF_ETHER = 250; // pounds
const NATIONAL_GRID_PRICE = 0.1437; //input
const BIOMASS_PRICE_MIN = 0.05; //input
const BIOMASS_PRICE_MAX = 0.12; //input
const WEI_IN_ETHER = 1000000000000000000;
const csvResultsFileName = 'simulationContinuousDoubleAuction_test1_2days.csv'; //output


async function init() {
    let aggregatedDemand = [];
    let aggregatedSupply = [];
    let historicalPricesPlot = [];
    let biomassAgentBalanceHistory = [];
    let biomassContractBalanceHistory = [];
    let nationalGridBalanceHistory = [];
    let successfulBids = [];
    let successfulAsks = [];
    let succesfulBidsPrice = [];
    let succesfulBidsTransactionAmount = 0; //converted from array

    let biomassSuccesfulBidsPrice = [];
    let biomassSuccesfulBidsTransactionAmount = 0; //converted from array

    let agentBalanceAverageAgent = [];
    let agentBalanceAverageContract = [];
    let agentExpenditureTotal = [];
    

    const exchange = await initExchange();
    const factory = await initHouseholdFactory();

    var accounts = await web3.eth.getAccounts();

    let { metaData, householdHistoricData, id, baseValue, baseValueBattery } = await getFiles(inputFile);

    let biomassData = generateBiomassData(householdHistoricData);

    let metaDataBattery = metaData.slice(0, Math.floor(metaData.length / 4));

    let householdDataBattery = householdHistoricData.slice(0, Math.floor(householdHistoricData.length) / 4);
    let { agentsBattery, agentNationalGrid, agentBiomass } = await createAgents(metaDataBattery, householdDataBattery, AgentNationalGrid, AgentBiomass, Agent, id, baseValue, baseValueBattery, biomassData, 12000, true, BIOMASS_PRICE_MIN, BIOMASS_PRICE_MAX);

    let simulationDurationCalc = 365 / simulationDays;
    let simDuration = householdHistoricData[0].length / Math.round(simulationDurationCalc);    //start simulation

    let nationalGridAddress = await agentNationalGrid.getAccount(accounts.length - 1); // make the last account from ganache to be the national grid address
    let biomassAddress = await agentBiomass.getAccount(accounts.length - 2);
    let {biomassContract, biomassContractAddress} = await agentBiomass.deployContract(factory, exchange);

    simDuration = Math.round(simDuration);
    let timeArray = [];
    console.log(`using ${agentsBattery.length} agents`);
    console.log('sim duration in hours', simDuration);
    console.log('sim duration in days', simDuration * 24);
    console.log('starting simulation');

    for (let i = 0; i < simDuration; i++) {
        timeArray.push(i);
        console.log('time', i);


        agentBiomass.setCurrentTime(i);

        try {
            await agentBiomass.sellingLogic(exchange);
        } catch (err) {
            console.log('error from selling logic biomass', err);
        }


        for (let j = 0; j < agentsBattery.length; j++) {

            if (i == 0) {
                try {
                    await agentsBattery[j].agent.setNationalGrid(NATIONAL_GRID_PRICE, nationalGridAddress);
                    await agentsBattery[j].agent.getAccount(j);
                    await agentsBattery[j].agent.deployContract(factory, exchange);
                } catch (err) {
                    console.log('error from first iteration deploying contract', err);
                }

            }
            agentsBattery[j].agent.setCurrentTime(i);
            try {
                await agentsBattery[j].agent.setAgentBalance();
            } catch (err) {
                console.log('error from setting agent balance', err);
            }
            try {
                await agentsBattery[j].agent.purchaseLogic();
            } catch (err) {
                console.log('error from purchase logic', err);
            }
            await agentsBattery[j].agent.updateCharge();
        }

        console.log('calculating metrics');
        let bidCountInExchange = await exchange.methods.getBidsCount().call();
        let askCountInExchange = await exchange.methods.getAsksCount().call();

        //check successful asks from Biomass agent
        //TODO this is wrong, need to be asks that we are getting
        // 1 - Get successful asks from contract, I added this capability to the contracts (expensive for contracts, cheaper for simulation)
        // 2 - Calcualte successful asks from checking agents bids and see which ones went to the biomass agents address (cheaper for contracts, more expensive for simulation)
        let askCountBiomass = await agentBiomass.household.methods.getSuccessfulBidCount().call();

        //calculate biomassSellingVolumePounds, calculate biomasSellingPrice,, amount of successfull Asks
        let biomassAskPrice = [];
        let biomassAskQuantity = [];
        let biomassAsksTransactionAmount = [];
        for (let k = 0; k < askCountBiomass; k++) {
            let ask = await agentBiomass.household.methods.getSuccessfulBid(k).call();
            let newAsk = {
                price: parseInt(ask[1]),
                quantity: parseInt(ask[2]),
                address: ask[0],
                time: parseInt(ask[3])
            }
            successfulAsks.push(newAsk);
            if (newAsk.time == i) {
                biomassAskPrice.push(newAsk.price);
                biomassAskQuantity.push(newAsk.quantity);
                biomassAsksTransactionAmount.push(newAsk.price * (newAsk.quantity / 1000));
            }
        }
        let amountSuccessfulAsks = biomassAskPrice.length;

        if (biomassAskPrice.length > 0) {
            let pricePounds = convertArrayWeiToPounds(biomassAskPrice, WEI_IN_ETHER, PRICE_OF_ETHER);
            biomassSuccesfulBidsPrice = (pricePounds / biomassAskPrice.length);
            biomassSuccesfulBidsTransactionAmount = convertArrayWeiToPounds(biomassAsksTransactionAmount, WEI_IN_ETHER, PRICE_OF_ETHER);
        }
        else {
            biomassSuccesfulBidsPrice = 0;
            biomassSuccesfulBidsTransactionAmount = 0;
        }


        //price, quantity, and transactionAmount extraction
        let bidsPrice = [];
        let bidsQuantity = [];
        let bidsTransactionAmount = [];
        let charge = [];
        let demand = [];
        let supply = [];


        let agentsBalanceHistoryAgent = [];
        let agentsBalanceHistoryContract = [];
        let transactionCostAvg = 0; //changed from array
        let transactionCosts = 0; //changed from array
        let transactionCostBid = [];
        let transactionCostAsk = [];
        let nationalGridBidsAggAmount = 0;
        let totalNumberTransactions = [];
        let contractInteractionCosts = [];
        let total_expenditure_hourly = [];
        
        let gasCostAsks = [];
        let gasCostBids = [];

        let successfulBidsGas = [];
        let successfulBidsAmount = [];
        let succesfulBidsSumCosts = [];
        let successfulBidsElect = [];
        let successfulBidsAggAmount = [];
        let successfulBidsAggGas = [];
        let successfulBidsTotalCost = [];

        let nationalGridBidsAmount = [];
        let nationalGridSumCosts = [];
        let nationalGridBidsQuantity = [];

        let biomassBalance = [];
        let biomassAskGas = [];
        let biomassVolumeElect = [];

        let biomassBidsElect = [];
        let biomassAskGasTemp = [];
        let nationalGridBidsGas = [];


        for (let j = 0; j < agentsBattery.length; j++) {

            let bidCount = await agentsBattery[j].agent.household.methods.getSuccessfulBidCount().call();

            for (let k = 0; k < bidCount; k++) {
                let bid = await agentsBattery[j].agent.household.methods.getSuccessfulBid(k).call();
                newBid = {
                    price: parseInt(bid[1]),
                    quantity: parseInt(bid[2]),
                    address: bid[0],
                    time: parseInt(bid[3])
                }
                successfulBids.push(newBid);
                if (newBid.time == i) {
                    bidsPrice.push(newBid.price);
                    bidsQuantity.push(newBid.quantity);
                    bidsTransactionAmount.push(newBid.price * (newBid.quantity / 1000));
                }
            }

            //Add on other necessary Metrics
            demand.push(agentsBattery[j].agent.historicalDemand[i].demand);
            supply.push(agentsBattery[j].agent.historicalSupply[i].supply);

            agentsBalanceHistoryAgent.push(convertWeiToPounds(agentsBattery[j].agent.balanceHistoryAgent[i], WEI_IN_ETHER, PRICE_OF_ETHER));
            agentsBalanceHistoryContract.push(convertWeiToPounds(agentsBattery[j].agent.balanceHistoryContract[i], WEI_IN_ETHER, PRICE_OF_ETHER))

            for (let k = 0; k < agentsBattery[j].agent.chargeHistory.length; k++) {

                if (agentsBattery[j].agent.chargeHistory[k].timeRow == i) {
                    console.log(`updating charge in time ${i} for agent ${j}, index of charge history ${k}`);
                    charge.push(agentsBattery[j].agent.chargeHistory[k].charge);
                }
                else {
                    charge.push(0);
                }
            }
            for (let k = 0; k < agentsBattery[j].agent.costTransactions.length; k++) {
                if (agentsBattery[j].agent.costTransactions[k].timeRow == i) {
                    contractInteractionCosts.push(agentsBattery[j].agent.costTransactions[k].transactionCost);
                }
            }

            //get Bids from bid history
            for (let k = 0; k < agentsBattery[j].agent.bidHistory.length; k++) {

                if (agentsBattery[j].agent.bidHistory[k].timeRow == i) {
                    gasCostBids.push(agentsBattery[j].agent.bidHistory[k].transactionCost);
                }
            }

            //get ask history
            for (let z = 0; z < agentsBattery[j].agent.askHistory.length; z++) {

                if (agentsBattery[j].agent.askHistory[z].timeRow == i) {
                    gasCostAsks.push(agentsBattery[j].agent.askHistory[z].transactionCost);
                }
            }

            //get bids that were successful 
            for (let k = 0; k < agentsBattery[j].agent.successfulBidHistory.length; k++) {
                if (agentsBattery[j].agent.successfulBidHistory[k].timeRow == i) {
                    successfulBidsElect.push(agentsBattery[j].agent.successfulBidHistory[k].quantity);
                    successfulBidsGas.push(agentsBattery[j].agent.successfulBidHistory[k].transactionCost);
                    successfulBidsAmount.push(agentsBattery[j].agent.successfulBidHistory[k].transactionAmount);
                    succesfulBidsSumCosts.push(convertGasToPounds(agentsBattery[j].agent.successfulBidHistory[k].transactionCost, GASPRICE, WEI_IN_ETHER, PRICE_OF_ETHER));
                    succesfulBidsSumCosts.push(convertWeiToPounds(agentsBattery[j].agent.successfulBidHistory[k].transactionAmount, WEI_IN_ETHER, PRICE_OF_ETHER));

                    if (agentsBattery[j].agent.successfulBidHistory[k].receiver == biomassContractAddress) {
                        console.log('found a biomass trade and adding it to biomass electrical metric', i)
                        biomassBidsElect.push(agentsBattery[j].agent.successfulBidHistory[k].quantity)
                        // TODO explore this possibility of recording successfulAsks from biomass contract = > biomassSuccessfulAsks.push(agentsBattery[j].agent.successfulBidHistory[k])
                    }
                }
            }

            //get NationalGrid Purchases
            // let obj = agentsBattery[j].agent.nationalGridPurchases.find((obj) => obj.timeRow == i)
            // obj.

            // let obj = agentsBattery.find(function (obj) { return obj.agentAccount === asks[i].address; });
            //             obj.agent.discharge(asks[i].amount);
            //             unFilledAsks.push(asks[i]);
            for (let k = 0; k < agentsBattery[j].agent.nationalGridPurchases.length; k++) {
                if (agentsBattery[j].agent.nationalGridPurchases[k].timeRow == i) {
                    nationalGridBidsQuantity.push(agentsBattery[j].agent.nationalGridPurchases[k].quantity);
                    nationalGridBidsAmount.push(agentsBattery[j].agent.nationalGridPurchases[k].transactionAmount);
                    nationalGridBidsGas.push(agentsBattery[j].agent.nationalGridPurchases[k].transactionCost);
                    nationalGridSumCosts.push(convertGasToPounds(agentsBattery[j].agent.nationalGridPurchases[k].transactionCost, GASPRICE, WEI_IN_ETHER, PRICE_OF_ETHER));
                    nationalGridSumCosts.push(convertWeiToPounds(agentsBattery[j].agent.nationalGridPurchases[k].transactionAmount, WEI_IN_ETHER, PRICE_OF_ETHER));
                }
            }
        }





        //After Looping through agents
        //Calculations for gas
        //calculations for the bids
        if (gasCostBids.length > 0) {
            let bidCostPounds = convertArrayGasToPounds(gasCostBids, GASPRICE, WEI_IN_ETHER, PRICE_OF_ETHER);
            transactionCostBid[i] = bidCostPounds;
        }
        else if (gasCostBids.length == 0) {
            transactionCostBid[i] = 0;
        }

        //calculation for the asks
        if (gasCostAsks.length > 0) {
            let askCostPounds = convertArrayGasToPounds(gasCostAsks, GASPRICE, WEI_IN_ETHER, PRICE_OF_ETHER);
            transactionCostAsk[i] = askCostPounds;
        }
        else if (gasCostAsks.length == 0) {
            transactionCostAsk[i] = 0;
        }

        let chargeDischargeTXCosts = 0;
        if (contractInteractionCosts.length > 0) {
            chargeDischargeTXCosts = convertArrayGasToPounds(contractInteractionCosts, GASPRICE, WEI_IN_ETHER, PRICE_OF_ETHER);
        } else if (contractInteractionCosts.length == 0) {
            chargeDischargeTXCosts = 0;
        }
        //Some random time steps,a Nan appears, hence this loop
        // for(let j = 0; j < transactionCostAsk.length; j++) {
        //     if(isNaN(transactionCostAsk[j])) {
        //         transactionCostAsk[j] = 0;
        //     }
        // }

        //calculate sum of transactions
        let sumTransactions = gasCostAsks.length + gasCostBids.length + contractInteractionCosts.length + biomassAskGasTemp.length;
        totalNumberTransactions.push(sumTransactions);

        transactionCostAvg = (transactionCostAsk[i] + transactionCostBid[i] + chargeDischargeTXCosts) / sumTransactions;
        transactionCosts = transactionCostAsk[i] + transactionCostBid[i] + chargeDischargeTXCosts + biomassAskGas[i];

        let tradingVolumeElect = 0;
        //calc for successful bids (the ones actually went through where there was a transaction of ether)
        if (successfulBidsGas.length > 0) {
            let succesfulBidsSumCostsPounds = succesfulBidsSumCosts.reduce((a, b) => a + b, 0);
            let bidsAmountPoundsAveraged = convertArrayWeiToPounds(successfulBidsAmount, WEI_IN_ETHER, PRICE_OF_ETHER);
            let bidsGasPoundsAveraged = convertArrayGasToPounds(successfulBidsGas, GASPRICE, WEI_IN_ETHER, PRICE_OF_ETHER);
            successfulBidsTotalCost[i] = succesfulBidsSumCostsPounds;
            successfulBidsAggAmount[i] = bidsAmountPoundsAveraged;
            successfulBidsAggGas[i] = bidsGasPoundsAveraged;
            tradingVolumeElect = successfulBidsElect.reduce((a, b) => a + b, 0);
            let biomassVolumeElect = biomassBidsElect.reduce((a, b) => a + b, 0);
        } else if (successfulBidsGas == 0) {
            successfulBidsTotalCost[i] = 0;
            successfulBidsAggAmount[i] = 0;
            successfulBidsAggGas[i] = 0;
            tradingVolumeElect = 0;
            biomassVolumeElect.push(0);
        }

        //calc the national grid purchases, amount, gas consumed and frequency
        if (nationalGridBidsGas.length > 0) {
            let nationalGridSumCostsPounds = nationalGridSumCosts.reduce((a, b) => a + b, 0);
            let nationalGridBidsAmountPounds = convertArrayWeiToPounds(nationalGridBidsAmount, WEI_IN_ETHER, PRICE_OF_ETHER);
            nationalGridBidsAggAmount = nationalGridBidsAmountPounds;

        }
        else if (nationalGridBidsGas.length == 0) {
            nationalGridBidsAggAmount = 0;
        }

        

        //sum up recorded metric from all the agents
        
        let succesfulBidsQuantity = bidsQuantity.reduce((a, b) => a + b, 0);
        console.log(`time ${i} bidsQuantity is ${succesfulBidsQuantity}`);
        console.log(`time ${i} tradingVolumeElect is ${tradingVolumeElect}`);
        // let tradingVolumeElect = succesfulBidsQuantity + 


        const aggregatedDemand = demand.reduce((a, b) => a + b, 0);
        const aggregatedSupply = supply.reduce((a, b) => a + b, 0);
        let chargeHistoryAggregated = charge.reduce((a, b) => a + b, 0);


        //update the balances
        nationalGridBalanceHistory.push(await agentNationalGrid.getAgentBalance()); //initialise the balance count
        let { balance, contractBalance } = await agentBiomass.setAgentBalance();
        biomassAgentBalanceHistory.push(balance);
        biomassContractBalanceHistory.push(contractBalance);

        //agent balance averaged - history
        agentBalanceAverageAgent.push((agentsBalanceHistoryAgent.reduce((a, b) => a + b, 0)) / agentsBattery.length);
        agentBalanceAverageContract.push(agentsBalanceHistoryContract.reduce((a, b) => a + b, 0) / agentsBattery.length);
        console.log('')
        agentExpenditureTotal.push(agentBalanceAverageAgent[i] + agentBalanceAverageContract[i]);
        total_expenditure_hourly.push(agentExpenditureTotal[i - 1] - agentExpenditureTotal[i]);

        //get hourly metrics for agent expenditure
        let hourlyExpenditure = 0;
        if (agentBalanceAverageAgent.length > 0) {
            let hourlyExpenditurePounds = agentBalanceAverageAgent[i - 1] - agentBalanceAverageAgent[i];
            let hourlyExpenditureTrade = agentBalanceAverageContract[i - 1] - agentBalanceAverageContract[i];
            hourlyExpenditure = hourlyExpenditurePounds + hourlyExpenditureTrade;
        }

        if (bidsPrice.length > 0) {
            let pricePounds = convertArrayWeiToPounds(bidsPrice, WEI_IN_ETHER, PRICE_OF_ETHER);
            succesfulBidsPrice.push((pricePounds / bidsPrice.length));
            succesfulBidsTransactionAmount = convertArrayWeiToPounds(bidsTransactionAmount, WEI_IN_ETHER, PRICE_OF_ETHER);
        }
        else {
            succesfulBidsPrice.push(0);
        }
        console.log('prices this time', succesfulBidsPrice[i]);
        agentsBattery.map(singleAgent => singleAgent.agent.updatePriceHistory(succesfulBidsPrice[i], i));

        let amountSuccessfulBids = bidsPrice.length;



        writeDataToCSV(
            i,
            aggregatedDemand,
            aggregatedSupply,
            succesfulBidsPrice[i],
            transactionCostAvg,
            total_expenditure_hourly[i],
            transactionCosts,
            succesfulBidsTransactionAmount,
            biomassSuccesfulBidsTransactionAmount,
            nationalGridBidsAggAmount,
            succesfulBidsQuantity,
            sumTransactions,
            amountSuccessfulBids,
            nationalGridBidsGas.length,
            gasCostBids.length,
            gasCostAsks.length + amountSuccessfulAsks,
            bidCountInExchange,
            askCountInExchange,
            chargeHistoryAggregated,
            hourlyExpenditure,
            csvResultsFileName
        )
    }
}

//needed values to calculate
// time: i,
// agg_demand: aggregatedDemand[i], done
// agg_supply: aggregatedSupply[i], done
// historical_prices: succesfulBidsPrice[i], done
// cost_transaction: transactionCostAvg[i], done
// total_expenditure_hourly: total_expenditure_hourly[i], done
// total_transaction_cost: transactionCosts[i], done
// trading_volume: succesfulBidsTransactionAmount[i], done
// biomass_volume: biomassSuccesfulBidsTransactionAmount[i],
// nat_grid_volume: nationalGridBidsAggAmount[i],
// trading_volume_elect: succesfulBidsQuantity[i],
// no_total_transactions: totalNumberTransactions[i],
// no_trades_market: amountSuccessfulBids[i],
// no_nat_grid_transactions: nationalGridBidsGas.length,
// no_bids: gasCostBids.length,
// no_asks: gasCostAsks.length + amountSuccessfulAsks[i],
// no_bids_market: bidCount[i],
        // no_asks_market: askCount[i],
        // charge_history_agg: chargeHistoryAggregated[i],
// avg_expenditure_hourly: hourlyExpenditure[i],
// // function writeDataToCSV(
// //     time,
// gg_demand,
// //     agg_supply,
// //     historical_prices,
// //     cost_transaction,
// //     total_expenditure_hourly,
//         //     total_transaction_cost,
// rading_volume,
// //     biomass_volume,
// //     nat_grid_volumel,
// //     trading_volume_elect,
// o_total_transactions,
// //     no_trades_market,
// //     no_nat_grid_transactions,
//         //     no_bids,
//         //     no_asks,
// //     no_bids_market,
// //     no_asks_market,
// //     charge_history_agg,
// vg_expenditure_hourly,
// svResultsFileName
// // )



init();





