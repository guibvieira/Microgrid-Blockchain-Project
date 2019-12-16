let fs = require('fs');
var csv = require("fast-csv");
const readCSV = require('./readFile.js');
var csvWriter = require('csv-write-stream');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));


function writeDataToCSV(
    time,
    agg_demand,
    agg_supply,
    historical_prices,
    cost_transaction,
    total_expenditure_hourly,
    total_transaction_cost,
    trading_volume,
    biomass_volume,
    nat_grid_volumel,
    trading_volume_elect,
    no_total_transactions,
    no_trades_market,
    no_nat_grid_transactions,
    no_bids,
    no_asks,
    no_bids_market,
    no_asks_market,
    charge_history_agg,
    avg_expenditure_hourly,
    csvResultsFileName
) {
    var csvWriter = require('csv-write-stream');
    var writer = csvWriter({ sendHeaders: false }); //Instantiate var

    // If CSV file does not exist, create it and add the headers
    if (!fs.existsSync(csvResultsFileName)) {
        writer = csvWriter({ sendHeaders: false });
        writer.pipe(fs.createWriteStream(csvResultsFileName));
        writer.write({
            header1: 'time',
            header2: 'agg_demand',
            header3: 'agg_supply',
            header4: 'historical_prices',
            header5: 'cost_transaction',
            header6: 'total_expenditure_hourly',
            header7: 'total_transaction_cost',
            header8: 'trading_volume',
            header9: 'biomass_volume',
            header10: 'nat_grid_volumel',
            header11: 'trading_volume_elect',
            header12: 'no_total_transactions',
            header13: 'no_trades_market',
            header14: 'no_nat_grid_transactions',
            header15: 'no_bids',
            header16: 'no_asks',
            header17: 'no_bids_market',
            header18: 'no_asks_market',
            header19: 'charge_history_agg',
            header20: 'avg_expenditure_hourly'
        });
        writer.end();
    }

    // Append some data to CSV the file    
    writer = csvWriter({ sendHeaders: false });
    writer.pipe(fs.createWriteStream(csvResultsFileName, { flags: 'a' }));
    writer.write({
        header1: time,
        header2: agg_demand,
        header3: agg_supply,
        header4: historical_prices,
        header5: cost_transaction,
        header6: total_expenditure_hourly,
        header7: total_transaction_cost,
        header8: trading_volume,
        header9: biomass_volume,
        header10: nat_grid_volumel,
        header11: trading_volume_elect,
        header12: no_total_transactions,
        header13: no_trades_market,
        header14: no_nat_grid_transactions,
        header15: no_bids,
        header16: no_asks,
        header17: no_bids_market,
        header18: no_asks_market,
        header19: charge_history_agg,
        header20: avg_expenditure_hourly
    });
    writer.end();
}

function indexOfSmallest(a) {
    var lowest = 0;
    for (var i = 1; i < a.length; i++) {
        if (a[i] < a[lowest]) lowest = i;
    }
    return lowest;
}

function removeFirsRow(householdHistoricData) {
    let tempArray = [];

    for (let i = 1; i < householdHistoricData.length; i++) {
        tempArray.push(householdHistoricData[i])
    }

    return tempArray;
}

function generateBiomassData(householdHistoricData) {
    let biomassData = Array(householdHistoricData[0].length).fill(0);

    for (let i = 0; i < householdHistoricData.length; i++) {


        let singleHousehold = removeFirsRow(householdHistoricData[i]);

        for (let j = 0; j < singleHousehold.length; j++) {
            biomassData[j] += singleHousehold[j][1] * 0.6; //satisfy 60% of their needs, modify to 40% to check if we can reduce the supply side
        }
    }
    return biomassData;
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

async function clearMarketBids(exchange, bidsCount) {
    let accounts = await web3.eth.getAccounts();

    for (let i = bidsCount - 1; i >= 0; i--) {
        await exchange.methods.removeBid(i).send({
            from: accounts[accounts.length - 1],
            gas: '6700000'
        });
    }
}

async function clearMarketHighPriceAsks(exchange, asksCount) {
    let accounts = await web3.eth.getAccounts();

    for (let i = 0; i < asksCount / 2; i++) {
        try {
            await exchange.methods.removeAsk(i).send({
                from: accounts[accounts.length - 1],
                gas: '6700000'
            });
        } catch (err) {
            console.log('error while trying to delete high price asks in th exchange');
        }
    }
}

async function clearMarket() {
    let bidsCount = await exchange.methods.getBidsCount().call();
    let asksCount = await exchange.methods.getAsksCount().call();
    let accounts = await web3.eth.getAccounts();

    for (let i = bidsCount - 1; i >= 0; i--) {
        await exchange.methods.removeBid(i).send({
            from: accounts[accounts.length - 1],
            gas: '6700000'
        });
        bidsCount = await exchange.methods.getBidsCount().call();
    }
    for (let i = asksCount - 1; i >= 0; i--) {
        await exchange.methods.removeAsk(i).send({
            from: accounts[accounts.length - 1],
            gas: '6700000'
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
    for (let i = 0; i < bids.length; i++) {
        for (let j = 0; j < asks.length; j++) {
            temp[j] = Math.abs(bids[i][0] - asks[j][0]);
        }
        let minimumIndex = indexOfSmallest(temp);
        matchingOrders.push(new Array(bids[i], asks[minimumIndex]));
    }

    for (let j = 0; j < bids.length; j++) {
        if (matchingOrders.includes(bids[j]) == false) {
            nonMatchedBids = bids[j];
        }
    }

    for (let j = 0; j < asks.length; j++) {
        if (matchingOrders.includes(asks[j]) == false) {
            nonMatchedAsks = asks[j];
        }
    }
}

function standardDeviation(values) {
    var avg = average(values);

    var squareDiffs = values.map(function (value) {
        var diff = value - avg;
        var sqrDiff = diff * diff;
        return sqrDiff;
    });

    var avgSquareDiff = average(squareDiffs);

    var stdDev = Math.sqrt(avgSquareDiff);
    return stdDev;
}

function average(data) {
    var sum = data.reduce(function (sum, value) {
        return sum + value;
    }, 0);

    var avg = sum / data.length;
    return avg;
}

async function loadData(inputFile) {
    let resultSet = await readCSV(inputFile);
    return resultSet;
}

function deleteRow(arr, row) {
    arr = arr.slice(0); // make copy
    arr.splice(row, 1);
    return arr;
}

async function getFiles(inputFile) {
    console.log('reading files...');
    let householdFiles = [];
    let householdHistoricData = [];
    let metaData = await loadData(inputFile);
    let id = [];
    let baseValue = [];
    let baseValueBattery = [];

    metaData = deleteRow(metaData, 0);// remove header of file

    for (i = 0; i < metaData.length; i++) {
        id.push(metaData[i][0]);
        baseValue.push(metaData[i][2]);
        baseValueBattery.push(metaData[i][3]);
        householdFiles.push(`./data/household_${id[i]}.csv`); // `householdFile
    }

    for (const file of householdFiles) {
        householdHistoricData.push(await loadData(file));
    }
    return { metaData, householdHistoricData, id, baseValue, baseValueBattery };
}

async function createAgents(metaData, householdHistoricData, AgentNationalGrid, AgentBiomass, Agent, id, baseValue, baseValueBattery, biomassData, batteryCapacity, batteryBool, BIOMASS_PRICE_MIN, BIOMASS_PRICE_MAX) {
    console.log('creating agents...');
    let agentsBattery = [];
    let agentNationalGrid = new AgentNationalGrid();
    let agentBiomass = new AgentBiomass(BIOMASS_PRICE_MIN, BIOMASS_PRICE_MAX);


    agentBiomass.loadData(biomassData);

    for (const item in metaData) {

        //creation of agents and feeding the data in
        agent = new Agent(batteryCapacity, batteryBool); //no battery capacity passed

        agentAccount = await agent.getAccount(item);

        //household = await agent.deployContract();

        await agent.loadSmartMeterData(householdHistoricData[item], baseValue[item], baseValueBattery[item], id[item]);
        let newAgent = {
            id: id[item],
            agent,
            agentAccount
        }
        agentsBattery.push(newAgent);
    }
    return { agentsBattery, agentNationalGrid, agentBiomass };
}

async function getExchangeBids(exchange) {
    let bids = [];
    let asks = [];
    let bid = 0;
    let ask = 0;
    let bidsVolumeElect = [];
    let asksVolumeElect = [];

    let bidsCount = await exchange.methods.getBidsCount().call();
    let asksCount = await exchange.methods.getAsksCount().call();

    for (let i = 0; i <= bidsCount - 1; i++) {
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
        bidsVolumeElect.push(parseInt(bid[2]));
    }
    for (let j = 0; j <= asksCount - 1; j++) {
        try {
            ask = await exchange.methods.getAsk(j).call();
        } catch (err) {
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
        asksVolumeElect.push(parseInt(ask[2]));
    }
    return { bids, asks, bidsVolumeElect, asksVolumeElect };
}

module.exports = { writeDataToCSV, indexOfSmallest, removeFirsRow, generateBiomassData, clearMarket, findMatch, sortByAmount, loadData, getFiles, createAgents, getExchangeBids, clearMarketBids, clearMarketHighPriceAsks };