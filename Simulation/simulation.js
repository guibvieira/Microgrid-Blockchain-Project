//requirements
//Using ganache
const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
web3 = new Web3( new Web3.providers.HttpProvider("http://localhost:7545"))
const Agent = require('../models/agent.js');

//compiled contracts
const factory = require('../ethereum/factory');
const exchange = require('../ethereum/exchange');

const readCSV = require('./readFile.js');
let fs = require('fs');
let parse = require('csv-parse');
let async = require('async');
let inputFile = '../data/metadata-LCOE.csv';
let id = new Array();
let baseValue = new Array();
let baseValueBattery = new Array();

let agentsNoBattery = new Array();
let agentsBattery = new Array();


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
    let householdFiles = new Array();
    let householdHistoricData = new Array();
    let metaData= await loadData(inputFile);

    metaData = deleteRow(metaData, 0);// remove header of file

    for (i=0; i<metaData.length; i++){
            id.push( metaData[i][0] );
            baseValue.push( metaData[i][2] );
            baseValueBattery.push( metaData[i][3] );
            householdFiles.push(`../data/household_${id[i]}.csv`);
    }

    for (const file of householdFiles){
        householdHistoricData.push( await loadData(file));
    }
    const responses = await Promise.all(householdHistoricData);
    return { metaData, householdHistoricData};
}

async function createAgents(metaData, householdHistoricData, batteryCapacity) {
    let agents = new Array();
   

    try{
    for (const item in metaData){

        //creation of agents and feeding the data in
        agent = new Agent(batteryCapacity); //no battery capacity passed

        agentAccount = await agent.getAccount(item);
        
        household = await agent.deployContract();

        
        const awaitResults = await agent.loadSmartMeterData(householdHistoricData[item], baseValue[item], baseValueBattery[item]);
        agents.push(new Array(id[item], agent, agentAccount));
        
    }               
    return agents;

    }catch(err){
        console.log(err)
    }
    
}

async function init(){

    let { metaData, householdHistoricData } = await getFiles();

    let metaDataBattery = metaData.slice(0, Math.floor(metaData.length/2));
    let metaDataNoBattery = metaData.slice( Math.floor(metaData.length)/2 , metaData.length-1 );

    let householdDataBattery = householdHistoricData.slice(0, Math.floor(householdHistoricData.length)/2 );
    let householdDataNoBattery = householdHistoricData.slice(Math.floor(householdHistoricData.length)/2, householdHistoricData.length-1);

    let agentsBattery = await createAgents(metaDataBattery, householdDataBattery, 12000);
    let agentsNoBattery =  await createAgents(metaDataNoBattery, householdDataNoBattery, 0);

    //start simulation
    
    for (i= 0; i < 50; i++){

        for (j = 0; j < agentsBattery.length; j++){
            //setTimeStepInAgent

            //access agent to setTime
            agentsBattery[j][1].setCurrentTime(i);

            //makePredicitonDemand() --> will save prediction within class
            let predictionCheck = agentsBattery[j][1].makeDemandPrediction(i+10);

            console.log('prediction check', predictionCheck);
            //makePredictionSupply() --> will save prediction within class

            //correctWeights()

            //runAgentLogicDecision()
        }
    }
};

init();