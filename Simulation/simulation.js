//requirements
//Using ganache
// const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
web3 = new Web3( new Web3.providers.HttpProvider("http://localhost:8545"))
const Agent = require('../models/agentPred1.js');
const plotly = require('plotly')("guibvieira", "oI36xfxoUbcdc5XR0pEK");

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

    
      const awaitResults = await agent.loadSmartMeterData(householdHistoricData[item], baseValue[item], baseValueBattery[item]);
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

async function init() {

    let { metaData, householdHistoricData } = await getFiles();

    let metaDataBattery = metaData.slice(0, Math.floor(metaData.length/2));
    //let metaDataNoBattery = metaData.slice( Math.floor(metaData.length)/2 , metaData.length-1 );

    let householdDataBattery = householdHistoricData.slice(0, Math.floor(householdHistoricData.length)/2 );
    //let householdDataNoBattery = householdHistoricData.slice(Math.floor(householdHistoricData.length)/2, householdHistoricData.length-1);

    let agentsBattery = await createAgents(metaDataBattery, householdDataBattery, 12000, true);
    //let agentsNoBattery =  await createAgents(metaDataNoBattery, householdDataNoBattery, 0);

    // console.log('agents battery object', agentsBattery);
    // console.log('agents no battery object', agentsNoBattery);
    let simDuration = 365;    //start simulation
    let weightsHistory = new Array();
    let errorPredictions = new Array();
    let timeArray= new Array();
    let errorAggPrediction = new Array();
    
    for (i= 0; i < simDuration; i++){
        timeArray.push(i);
        

        for (j = 0; j < agentsBattery.length/4; j++){
            //setTimeStepInAgent

            //access agent to setTime
            agentsBattery[j].agent.setCurrentTime(i);
            let test = agentsBattery[j].agent.formulatePrice();
            console.log('test price', test);
            // let {averageErrorPred, randomErrorPred, rationalErrorPred } = agentsBattery[j].agent.correctWeights();
            // let newErrorPred = {
            //     id: agentsBattery[j].id,
            //     averageErrorPred: averageErrorPred,
            //     randomErrorPred: randomErrorPred,
            //     rationalErrorPred: rationalErrorPred
            // }
            // errorPredictions.push(newErrorPred);

            // let newWeightsHistory = {
            //     id: agentsBattery[j].id,
            //     averageWeights: agentsBattery[j].agent.weightDemandAvg,
            //     randomWeights: agentsBattery[j].agent.weightDemandRand,
            //     rationalWeights: agentsBattery[j].agent.weightDemandRat
            // }
            // weightsHistory.push(newWeightsHistory);

            // //makePredicitonDemand() --> will save prediction within class
            // let predictionAggregated = agentsBattery[j].agent.makeDemandPrediction();

            // let actualValue = agentsBattery[j].agent.historicalDemand[i].demand;
            // if(agentsBattery[j].id == 2337){
            //     let error = Math.abs(predictionAggregated-actualValue);
            //     errorAggPrediction.push((error/actualValue)*100);
            // }
            
            //makePredictionSupply() --> will save prediction within class

            

            //runAgentLogicDecision()
        }
    }

    // let idFind = 2337;
    // let weightsHistoryFinal = new Array();
    // let errorPredictionsFinal = new Array();
    // let errorAverage = new Array();
    // let errorRandom = new Array();
    // let errorRational = new Array();

    // for(let i=0; i< weightsHistory.length; i++) {
    //     if(weightsHistory[i].id == idFind){
    //         weightsHistoryFinal.push(new Array(weightsHistory[i].averageWeights, weightsHistory[i].randomWeights, weightsHistory[i].rationalWeights));
    //     }
    // }

    // for(let i=0; i< errorPredictions.length; i++) {
    //     if(errorPredictions[i].id == idFind){
    //         errorPredictionsFinal.push(new Array(errorPredictions[i].averageErrorPred, errorPredictions[i].randomErrorPred, errorPredictions[i].rationalErrorPred))
    //         errorAverage.push(errorPredictions[i].averageErrorPred);
    //         errorRandom.push(errorPredictions[i].randomErrorPred);
    //         errorRational.push(errorPredictions[i].rationalErrorPred);
    //     }
    // }
    // console.log('error average prediction', errorAggPrediction);
    // //for error in prediction
    // var trace1 = {
    //     x: timeArray,
    //     y: errorAggPrediction,
    //     name: "yaxis data",
    //     type: "scatter"
    // }
    // var data = [trace1];
    // var layout = {
    //     title: '1 Hour Ahead Prediction Error(%)',
    //     xaxis: {
    //       title: 'Time',
    //       titlefont: {
    //         family: 'Courier New, monospace',
    //         size: 18,
    //         color: '#7f7f7f'
    //       }
    //     },
    //     yaxis: {
    //       title: 'Percentage (%)',
    //       titlefont: {
    //         family: 'Courier New, monospace',
    //         size: 18,
    //         color: '#7f7f7f'
    //       }
    //     }
    // };

    // var graphOptions = {layout: layout, filename: "prediction error", fileopt: "overwrite"};
    // plotly.plot(data, graphOptions, function (err, msg) {
    //     console.log(msg);
    // });



    
    //for weight error tracking
    // var trace1 = {
    //     x: timeArray,
    //     y: errorAverage,
    //     name: "yaxis data",
    //     type: "scatter"
    //   };
    //   var trace2 = {
    //     x: timeArray,
    //     y: errorRandom,
    //     name: "yaxis2 data",
    //     yaxis: "y2",
    //     type: "scatter"
    //   };
    //   var trace3 = {
    //     x: timeArray,
    //     y: errorRational,
    //     name: "yaxis2 data",
    //     yaxis: "y3",
    //     type: "scatter"
    //   };
    //   var data = [trace1, trace2, trace3];
    //   var layout = {
    //     title: "Predictor Errors over Time",
    //     yaxis: {title: "Average predictor"},
    //     yaxis2: {
    //       title: "Random predictor",
    //       titlefont: {color: "rgb(148, 103, 189)"},
    //       tickfont: {color: "rgb(148, 103, 189)"},
    //       overlaying: "y",
    //       side: "right"
    //     },
    //     yaxis3: {
    //         title: "Rational predictor",
    //         titlefont: {color: "rgb(148, 200, 189)"},
    //         tickfont: {color: "rgb(148, 200, 189)"},
    //         overlaying: "y",
    //         side: "right"
    //     }
    //   };
    //   var graphOptions = {layout: layout, filename: "Predictor Errors over Time", fileopt: "overwrite"};
    //   plotly.plot(data, graphOptions, function (err, msg) {
    //       console.log(msg);
    //   });
};

init();