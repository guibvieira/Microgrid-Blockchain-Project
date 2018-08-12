//requirements
//Using ganache
// const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
web3 = new Web3( new Web3.providers.HttpProvider("http://localhost:8545"))
const Agent = require('../models/agentSimulation.js');
const plotly = require('plotly')("guibvieira", "oI36xfxoUbcdc5XR0pEK");

//compiled contracts
//const factory = require('../ethereum/factory');
const exchange = require('../ethereum/exchange');

//packages and functions imports
const readCSV = require('./readFile.js');
let fs = require('fs');
let parse = require('csv-parse');
let async = require('async');
let calculateIntersection = require('./intersection');
let inputFile = '../data/metadata-LCOE.csv';
let id = new Array();
let baseValue = new Array();
let baseValueBattery = new Array();

let agentsNoBattery = new Array();
let agentsBattery = new Array();


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

async function createAgents(metaData, householdHistoricData, batteryCapacity, batteryBool) {
    let agents = new Array();

    try {
        for (const item in metaData){

        //creation of agents and feeding the data in
        agent = new Agent(batteryCapacity, batteryBool); //no battery capacity passed

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

    return agents;

  } catch (err) {
    console.log(err);
  }
    
}

async function getExchangeBids() {
    let bids = new Array();
    let asks = new Array();
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

async function init() {
    
    const simulationDays = 365; 
    const priceOfEther = 250;
    let unFilledBids = new Array();
    let unFilledAsks = new Array();
    let aggregatedDemand = new Array();
    let aggregatedSupply = new Array();
    let historicalPricesPlot = new Array();

    let accounts = await web3.eth.getAccounts();

    let { metaData, householdHistoricData } = await getFiles();

    let metaDataBattery = metaData.slice(0, Math.floor(metaData.length / 2));
    //let metaDataNoBattery = metaData.slice( Math.floor(metaData.length)/2 , metaData.length-1 );

    let householdDataBattery = householdHistoricData.slice(0, Math.floor(householdHistoricData.length) / 2 );
    //let householdDataNoBattery = householdHistoricData.slice(Math.floor(householdHistoricData.length)/2, householdHistoricData.length-1);

    let agentsBattery = await createAgents(metaDataBattery, householdDataBattery, 12000, true);
    //let agentsNoBattery =  await createAgents(metaDataNoBattery, householdDataNoBattery, 0, false);

    let simDuration = householdHistoricData[0].length / simulationDays;    //start simulation
    let timeArray= new Array();
    
    for (let i= 0; i < simDuration; i++){
        timeArray.push(i);
        console.log('time', i);
        

        for (let j = 0; j < agentsBattery.length; j++){
            agentsBattery[j].agent.setCurrentTime(i);
            // if( i=0){
            //     agentsBattery[j].agent.setInitialCharge();
            // }
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
            let acceptedBids = new Array();
            let acceptedAsks = new Array();
            let paidBids = new Array();

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
                
                if(confirmation == true){
                    console.log(`just sent funds from ${obj.agent.address} to ${objSeller.agent.address}`);
                }
            }

            let localUnfilledBids = acceptedBids.filter( el => {
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

    console.log('history of prices', agentsBattery[0].agent.historicalPrices);
    let history = agentsBattery[0].agent.historicalPrices;
    let chargeTime = new Array();
    let chargeHistory = new Array();

    const sumPrices= history.reduce((a, b) => a + b, 0);
    console.log('average of prices', sumPrices/simDuration);
    //calculating supply and demand aggregated for each time step
    for (let i = 0; i < simDuration; i++) {
        let demand = new Array();
        let supply = new Array();
        
        chargeHistory[i] = agentsBattery[0].agent.chargeHistory[0];
        chargeTime[i] = agentsBattery[0].agent.chargeHistory[1];

        //conversion from wei to pounds
        let tempPrice = agentsBattery[0].agent.historicalPrices[i];
        tempPrice = tempPrice.toFixed(0);
        tempPrice = web3.utils.fromWei(tempPrice, 'ether');
        historicalPricesPlot[i] = tempPrice * priceOfEther;

        for (let j = 0; j < agentsBattery.length; j++) {
            demand.push(agentsBattery[j].agent.historicalDemand[i].demand);
            supply.push(agentsBattery[j].agent.historicalSupply[i].supply);
        }
        const sumDemand = demand.reduce((a, b) => a + b, 0);
        const sumSupply = supply.reduce((a, b) => a + b, 0);
        aggregatedDemand[i] = sumDemand;
        aggregatedSupply[i] = sumSupply;
    }
    console.log('amount of charge', chargeHistory);
    console.log('charge time', chargeTime);
    
    var trace1 = {
        x: timeArray,
        y: historicalPricesPlot,
        name: "Historical Prices",
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
        x: chargeTime,
        y: chargeHistory,
        name: "Amount of Charge",
        yaxis: "y2",
        type: "scatter"
    }
    var data = [trace1, trace2, trace3, trace4];
    var layout = {
        title: "Day Simulation - Agents with Batteries",
        yaxis: {title: "Price (p/kWh)"},
        yaxis2: {
          title: "Energy (Wh)",
          titlefont: {color: "rgb(148, 103, 189)"},
          tickfont: {color: "rgb(148, 103, 189)"},
          overlaying: "y",
          side: "right"
        }
    };
    // var layout = {
    //     title: 'Day Simulation - Agents with Batteries',
    //     xaxis: {
    //       title: 'Time (h)',
    //       titlefont: {
    //         family: 'Courier New, monospace',
    //         size: 18,
    //         color: '#7f7f7f'
    //       }
    //     },
    //     yaxis: {
    //       title: 'Price (p/kWh)',
    //       titlefont: {
    //         family: 'Courier New, monospace',
    //         size: 18,
    //         color: '#7f7f7f'
    //       }
    //     },
    //     yaxis2: {
    //         title: "Energy (Wh)",
    //         titlefont: {color: "rgb(148, 103, 189)"},
    //         tickfont: {color: "rgb(148, 103, 189)"},
    //         overlaying: "y",
    //         side: "right"
    //       }
    // };

    var graphOptions = {layout: layout, filename: "Day Simulation - agents with batteries", fileopt: "overwrite"};
    plotly.plot(data, graphOptions, function (err, msg) {
        console.log(msg);
    });

};

init();

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