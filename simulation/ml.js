const ml = require('ml-regression');
const readCSV = require('./readFile.js');
const SLR = ml.SLR; // Simple Linear Regression

var fs = require('fs');
let csv = require('fast-csv');
let parse = require('csv-parse');

const inputFile = '../data/metadata-LCOE.csv'; // Data
let csvData = [], // parsed Data
    X = [], // Input
    y = []; // Output

let regressionModel;

const readline = require('readline'); // For user prompt to allow predictions

const rl = readline.createInterface({
    input: process.stdin, 
    output: process.stdout
});

function performRegression(X, y) {
    console.log('x',X);
    regressionModel = new SLR(X, y); // Train the model on training data
    console.log(regressionModel.toString(3));
    predictOutput();
}

function dressData() {
    /**
     * One row of the data object looks like:
     * {
     *   TV: "10",
     *   Radio: "100",
     *   Newspaper: "20",
     *   "Sales": "1000"
     * }
     *
     * Hence, while adding the data points,
     * we need to parse the String value as a Float.
     */

    for (i=0; i<csvData.length; i++){
        X.push(f(csvData[i][0]));
        y.push(f(csvData[i][1]));

    }
    console.log('X', X);
        console.log('Y', y);
    return {X, y};
}

function f(s) {
    return parseFloat(s);
}

function predictOutput() {
    rl.question('Enter input X for prediction (Press CTRL+C to exit) : ', (answer) => {
        console.log(`At X = ${answer}, y =  ${regressionModel.predict(parseFloat(answer))}`);
        predictOutput();
    });
}

async function loadData(inputFile){
    let resultSet = await readCSV(inputFile);
    return resultSet;
}

async function init(){
    csvData = await loadData(inputFile);
    //console.log('csv data', csvData);
    let {X, y} = dressData();
    performRegression(X, y);
}

init();