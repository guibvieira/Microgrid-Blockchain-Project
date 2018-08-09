//requirements
//Using ganache
// const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
web3 = new Web3( new Web3.providers.HttpProvider("http://localhost:8545"))
const Agent = require('../models/agentSingle-Bid.js');
const plotly = require('plotly')("guibvieira", "oI36xfxoUbcdc5XR0pEK");

//compiled contracts
const factory = require('../ethereum/factory');
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
    //console.log('metadata', metaData);
    for (i=0; i<metaData.length; i++){
            id.push( metaData[i][0] );
            //console.log('id', metaData[i][0]);
            baseValue.push( metaData[i][2] );
            baseValueBattery.push( metaData[i][3] );
            //console.log(`trying to find: ../data/household_${id[i]}.csv`);
            householdFiles.push(`../data/household_${id[i]}.csv`); // `householdFile
    }

    for (const file of householdFiles){
        householdHistoricData.push( await loadData(file));
    }
    const responses = await Promise.all(householdHistoricData);
    return { metaData, householdHistoricData};
}

async function createAgents(metaData, householdHistoricData, batteryCapacity, batteryBool) {
    let agents = new Array();

    try {
        
    for (const item in metaData){

        //creation of agents and feeding the data in
      agent = new Agent(batteryCapacity, batteryBool); //no battery capacity passed

      agentAccount = await agent.getAccount(item);
    
      household = await agent.deployContract();
    
      const awaitResults = await agent.loadSmartMeterData(householdHistoricData[item], baseValue[item], baseValueBattery[item], id [item]);
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

    for (let i=0; i<bidsCount; i++){
        bid = await exchange.methods.getBid(i).call();
        console.log('single bid', bid);
        bids.push(new Array(bid.amount, bid.price));
    }

    for (let j=9; j < asksCount; j++){
        ask = await exchange.methods.getAsk(i).call();
        console.log('single ask', ask);
        asks.push(new Array(asks.amount, asks.price));
    }
    return { bids, asks };
}

async function init() {

    let { metaData, householdHistoricData } = await getFiles();

    //let metaDataBattery = metaData.slice(0, Math.floor(metaData.length/2));
    let metaDataNoBattery = metaData.slice( Math.floor(metaData.length)/2 , metaData.length-1 );

    //let householdDataBattery = householdHistoricData.slice(0, Math.floor(householdHistoricData.length)/2 );
    let householdDataNoBattery = householdHistoricData.slice(Math.floor(householdHistoricData.length)/2, householdHistoricData.length-1);

    //let agentsBattery = await createAgents(metaDataBattery, householdDataBattery, 12000, true);
    let agentsNoBattery =  await createAgents(metaDataNoBattery, householdDataNoBattery, 0);
    console.log('check length of historic data', householdHistoricData[0].length);
    let simDuration = householdHistoricData[0].length/4;    //start simulation
    let weightsHistory = new Array();
    let errorPredictions = new Array();
    let timeArray= new Array();
    let errorAggPrediction = new Array();
    
    for (i= 0; i < simDuration; i++){
        timeArray.push(i);
        console.log('time', i);
        

        for (j = 0; j < agentsNoBattery.length/4; j++){

            agentsNoBattery[j].agent.setCurrentTime(i);

            await agentsNoBattery[j].agent.purchaseLogic();
            console.log('exit purchase logic');

        }

        let { bids, asks } = await getExchangeBids();
        // console.log('bids', bids);
        // console.log('asks', asks);
        if (bids.length > 0  && asks.length  > 0 ){        
            let intersection = calculateIntersection(bids, asks);
            console.log('intersection', intersection); //returns two values, first is the amount it intersects at , second the price
            //populate every agent with the closing price for this time step
            for (j = 0; j < agentsNoBattery.length/4; j++){

                agentsNoBattery[j].agent.historicalPrices[i] = intersection[1];
    
            }
        }
    }
    console.log('history of prices', this.agentsNoBattery[0].agent.historicalPrices);
};

init();