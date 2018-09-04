const {Matrix} = require('ml-matrix');
const LogisticRegression = require('ml-logistic-regression');
const csv = require('csvtojson');
//const SLR = ml.SLR; // Simple Linear Regression
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

    console.log('household data', householdData)

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
    for (i=1; i<householdData.length/300; i++){
        //X_train.push(new Array(parseFloat(householdData[i][3]), parseFloat(householdData[i][4]), parseFloat(householdData[i][5]), parseFloat(householdData[i][6]), parseFloat(householdData[i][7]), parseFloat(householdData[i][8]), parseFloat(householdData[i][9]),parseFloat(householdData[i][10]), parseFloat(householdData[i][11]), parseFloat(householdData[i][12]), parseFloat(householdData[i][13]), parseFloat(householdData[i][14]), parseFloat(householdData[i][15]) )  );
        X_train.push(new Array(+ parseFloat(householdData[i][8]), + parseFloat(householdData[i][10]), + parseFloat(householdData[i][2])  ));
    }

    for (k=householdData.length/300; k<householdData.length; k++){
        X_test.push(new Array(+ parseFloat(householdData[i][8]), + parseFloat(householdData[i][10])));
    }
    X_test = new Matrix(X_test);

    
    var trainingSet = new Array(X_train.length);
    var predictions = new Array(X_train.length);
    console.log('xtrain', X_test);
    for (var i = 0; i < X_train.length; ++i) {
        trainingSet[i] = X_train[i].slice(0,2);
        predictions[i] = X_train[i][2];
    }
    console.log('training set', trainingSet);
    console.log('prediction set', predictions);
    // our training set (X,Y)
var X = new Matrix(trainingSet);
var Y = Matrix.columnVector(predictions);
console.log('im before training');
// we will train our model
var logreg = new LogisticRegression({numSteps: 1000, learningRate: 5e-3});
logreg.train(X,Y);
console.log('im after training');
// we try to predict the test set
var finalResults = logreg.predict(X_test);
console.log('final results:', finalResults);
}
init();
