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

let accounts = await web3.eth.getAccounts();

async function loadData(inputFile){
    let resultSet = await readCSV(inputFile);
    return resultSet;
}

async function init(){
    let householdHistoricData = 0;
    let inputFile = '../data/metadata-LCOE.csv';
    let householdFile = '';
    let agentsNoBattery = new Array();
    let agentsBattery = new Array();
    
    metaData= await loadData(inputFile);
    console.log('logging results household 26', metaData);
    
    //create half the households without any battery Capacity
    for (i=1; i<metaData.length/2; i++){
        id = metaData[i][0];
        baseValue = metaData[i][2];
        baseValueBattery = metaData[i][3];
        householdFile = `../data/household_${id}.csv`;
        
        householdHistoricData = await loadData(householdFile);

        agent = new Agent(0); //no battery capacity passed
        agentAccount = await agent.getAccount(i);
        household = await agent.deployContract();
        await agent.loadSmartMeterData(householdHistoricData, baseValue, baseValueBattery);
        agentsNoBattery.push(agent);
    }
    //create half of the households with battery Capacity
    for (i=metaData.length/2; i<metaData.length; i++){
        id = metaData[i][0];
        baseValue = metaData[i][2];
        baseValueBattery = metaData[i][3];
        householdFile = `../data/household_${id}.csv`;
        
        householdVar = await loadData(householdFile);

        agent = new Agent(12000); //tesla powerwall
        agentAccount = await agent.getAccount(i);
        household = await agent.deployContract();

        agentsBattery.push(agent);

    }

    

    console.log('id', id);
    console.log('householdFile', householdFile);
    console.log('householdVar', householdVar);


    // accounts = await web3.eth.getAccounts();

    // agent = new Agent(5000);

    // agentAccount = await agent.getAccount();

    // agentBalance = await agent.getAgentBalance();

    // household = await agent.deployContract(5000);



};

init();
















// let csvData=[];
// var parser = parse({delimiter: ','}, function (err, data) {
//   async.eachSeries(data, function (line, callback) {
//     // do something with the line
//     csvData.push(line).then(function() {
//       // when processing finishes invoke the callback to move to the next one
//       callback();
//     });
//   })
// });
// fs.createReadStream(inputFile).pipe(parser);

// async function processFile() {
//     let file = '../data/houselhold_26.csv';
//     let household26 = await readFile.readFile(file);
//     return household26;
    
// }
//     let file = '../data/houselhold_26.csv';

//using d3
// d3.csv('../data/houselhold_26.csv', function(data) {
//     console.log(data[0]);
//   });


//Using parse package
// let csvData=[];
// let file = '../data/household_26.csv';
//     input = file;
//     fs.createReadStream(input)
//         .pipe(parse({delimiter: ','}))
//         .on('data', function(csvrow) {
//             //console.log(csvrow);
//             //do something with csvrow
//             csvData.push(csvrow);        
//         })
//         .on('end',function() {
//           //do something wiht csvData
//           console.log('finished');
//         });
        
// // let household26=processFile();
// // console.log(household26);
// console.log('printing first line', csvData[0])



