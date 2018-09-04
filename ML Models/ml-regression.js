const ml = require('ml-regression');
const csv = require('csvtojson');
const SLR = ml.SLR; // Simple Linear Regression
const readCSV = require('./readFile');
const plotly = require('plotly')('guibvieira', 'oI36xfxoUbcdc5XR0pEK');
const csvFilePath = '../data/household_26.csv'; // Data
let csvData = [], // parsed Data
    X = [], // Input
    y = []; // Output

let regressionModel;

const readline = require('readline'); // For user prompt to allow predictions

const rl = readline.createInterface({
    input: process.stdin, 
    output: process.stdout
});

async function loadData(inputFile){
    let resultSet = await readCSV(inputFile);
    return resultSet;
}

async function init(){
    inputFile = '../data/household_26.csv';
    householdData = await loadData(inputFile);

    //console.log('household data', householdData)

    var X_train = new Array();
    var X_test = new Array();
    let timeArray = new Array();

    // for (var i = 1; i < householdData.length; ++i) {
    //     trainingSet[i] = householdData[i].slice(3, 15);
    //     predictions[i] = householdData[i][2];
    // }
    
    //  predictions = predictions.join(' ').split(' ').map(parseFloat);
    //  trainingSet = trainingSet.join(' ').split(' ').map(parseFloat);
    //console.log('household data', householdData);
    //prepare the data
    for (i=1; i<householdData.length/365; i++){
        //X_train.push(new Array(parseFloat(householdData[i][3]), parseFloat(householdData[i][4]), parseFloat(householdData[i][5]), parseFloat(householdData[i][6]), parseFloat(householdData[i][7]), parseFloat(householdData[i][8]), parseFloat(householdData[i][9]),parseFloat(householdData[i][10]), parseFloat(householdData[i][11]), parseFloat(householdData[i][12]), parseFloat(householdData[i][13]), parseFloat(householdData[i][14]), parseFloat(householdData[i][15]) )  );
        X_train.push(new Array(+ parseFloat(householdData[i][8]), + parseFloat(householdData[i][10]), + parseFloat(householdData[i][2])  ));
    }
    
    var trainingSet = new Array(X_train.length);
    var predictions = new Array(X_train.length);
    console.log('xtrain', X_train);
    for (var i = 0; i < X_train.length; ++i) {
        trainingSet[i] = X_train[i][1];
        predictions[i] = X_train[i][2];
    }
    console.log('training set', trainingSet);
    console.log('prediction set', predictions);
    performRegression(trainingSet, predictions);
}
init();


// csv()
//     .fromFile(csvFilePath)
//     .on('json', (jsonObj) => {
//         console.log('data', csvData);
//         csvData.push(jsonObj);
        
//     })
//     .on('done', () => {
//         dressData(); // To get data points from JSON Objects
//         performRegression(); 
//     });

function performRegression() {
    regressionModel = new SLR(X, y); // Train the model on training data
    console.log('regression model', regressionModel.toString(3));
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
    csvData.forEach((row) => {
        X.push(f(row.Radio));
        y.push(f(row.Sales));
    });
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