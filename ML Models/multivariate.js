const {Matrix} = require('ml-matrix');
const MLR = require('ml-regression-multivariate-linear');
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
    // let x =  [ [ 0, 0 ],
    // [ 0, 0 ],
    // [ 0, 0 ],
    // [ 0, 0 ],
    // [ 0, 0 ],
    // [ 0, 0 ],
    // [ 0, 0 ],
    // [ 0, 0 ],
    // [ 0, 0 ],
    // [ 0, 0 ],
    // [ 0, 0 ],
    // [ 0, 0 ],
    // [ 0, 0 ],
    // [ 0, 0 ],
    // [ 0, 57 ],
    // [ 0, 83 ],
    // [ 70, 95 ],
    // [ 360, 99 ],
    // [ 21, 101 ],
    // [ 0, 98 ],
    // [ 31, 92 ],
    // [ 0, 80 ],
    // [ 0, 58 ],
    // [ 0, 12 ] ];
    // let y = [ 0,
    //     0,
    //     0,
    //     0,
    //     0,
    //     0,
    //     0,
    //     0,
    //     0.28635,
    //     0.7245833333333332,
    //     0.8835333333333331,
    //     1.8879666666666668,
    //     1.2427833333333331,
    //     0.9902833333333332,
    //     0.8277666666666667,
    //     0.2787666666666666,
    //     0.10168333333333332,
    //     0.013033333333333329,
    //     0,
    //     0,
    //     0,
    //     0,
    //     0,
    //     0 ];
    // our training set (X,Y)
    const x = [[0, 0], [1, 2], [2, 3], [3, 4]];
// Y0 = X0 * 2, Y1 = X1 * 2, Y2 = X0 + X1
const y = [[0, 0, 0], [2, 4, 3], [4, 6, 5], [6, 8, 7]];
    const mlr = new MLR(x, y);
    console.log('after training');
    console.log(mlr.predict([3,3]));
}
init();