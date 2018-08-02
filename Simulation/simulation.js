//requirements
//Using ganache
const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
web3 = new Web3( new Web3.providers.HttpProvider("http://localhost:7545"))
const Agent = require('../models/agent.js');

//compiled contracts
const compiledHousehold = require('../ethereum/build/Household.json');
const factory = require('../ethereum/factory');
const exchange = require('../ethereum/exchange');

const readCSV = require('./readFile.js');
let fs = require('fs');
let parse = require('csv-parse');
let async = require('async');
    let householdHistoricData = new Array();
    let householdHistoricData2 = new Array();
    let inputFile = '../data/metadata-LCOE.csv';
    let id = new Array();
    let baseValue = new Array();
    let baseValueBattery = new Array();
    let householdFiles = new Array();
    let agentsNoBattery = new Array();
    let agentsBattery = new Array();


async function loadData(inputFile){
    let resultSet = await readCSV(inputFile);
    return resultSet;
}



async function init(){

    async function getFiles() {
        const metaData= await loadData(inputFile);

        for (i=1; i<metaData.length/2; i++){
                console.log(i);
                id.push( metaData[i][0] );
                baseValue.push( metaData[i][2] );
                baseValueBattery.push( metaData[i][3] );
                householdFiles.push(`../data/household_${id[i-1]}.csv`);
        }
    
        for (const file of householdFiles){
            householdHistoricData.push( await loadData(file));
        }
        const responses = await Promise.all(householdHistoricData);
        //console.log(responses);
        return { householdHistoricData, metaData};
    }
    let fileResults = await getFiles();
//    await getFiles().then( await createAgents(metaData, householdHistoricData));
     metaData = fileResults.metaData;
     householdHistoricData = fileResults.householdHistoricData;

     await createAgents(metaData, householdHistoricData);

   


    // console.log('metaData', fileResults.metaData);
    // console.log('household historical data', fileResults.householdHistoricData[0]);
    
    // async function y (metaData, householdHistoricData) {
    //     if (fileResults !== null){
    //         results = await createAgents(metaData, householdHistoricData);

    //         console.log('agents without battery', results.agentsNoBattery);
    //         console.log('agents with battery', results.agentsBattery);
    //     }
    //     else{
    //         setTimeout(y, 1000);
    //     }
    // }  
    // await y(metaData, householdHistoricData);
        



    

    async function createAgents(metaData, householdHistoricData){
        console.log('this is id ', metaData);
        
        for (const item in metaData){
            //console.log(i);            
        
            //creation of agents and feeding the data in
            agent = new Agent(0); //no battery capacity passed
            agentAccount = await agent.getAccount(item);
            //console.log('agents account', agentAccount);
            household = await agent.deployContract();
            //console.log('household contract', household);
            //console.log('this is household data:', householdHistoricData[0]);
            try{
                const awaitResults = await agent.loadSmartMeterData(householdHistoricData[item], baseValue[item], baseValueBattery[item]);
            await Promise.all(awaitResults);
            }catch(err){
                console.log(err)
            }
                
            agentsNoBattery.push( new Array(id, agent));
        }
    
        //create half of the households with battery Capacity
        // for (i=23; i<46; i++){
        //         //creation of agents and feeding the data in
        //     agent = new Agent(12000); //tesla powerwall
        //     agentAccount = await agent.getAccount(i);
        //     household = await agent.deployContract();
        //     await agent.loadSmartMeterData(householdHistoricData[i], baseValue[i], baseValueBattery[i]);
        //     agentsBattery.push(new Array(id, agent));
           
        // }
        return {  agentsNoBattery };
    }
};

init();