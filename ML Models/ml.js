var FeedForwardNeuralNetworks = require('ml-fnn');
const readCSV = require('./readFile');


async function loadData(inputFile){
    let resultSet = await readCSV(inputFile);
    return resultSet;
}
async function init(){
    inputFile = '../data/household_26.csv';
    householdData = await loadData(inputFile);

    let X_train = new Array();
    let X_test = new Array();
    //prepare the data
    for (i=0; i<householdData.length; i++){
        X_train.push(new Array(householdData[i][0], householdData[i][4], householdData[i][5], householdData[i][6], householdData[i][7], householdData[i][8],householdData[i][9],householdData[i][10],householdData[i][11], householdData[i][12], householdData[i][13],householdData[i][14],householdData[i][15] )  );
        X_test.push( householdData[i][2] );
    }
    options = {
        hiddenLayers: [3],
        iterations: 30,
        learningRate: 0.01,
        activation: 'relu'
    }
    
    /* Create a neural network with 4 layers (2 hidden layers) */
    let network = new FeedForwardNeuralNetworks(options)

    network.train(X_train, X_test);
    let result= network.predict(X_train[50]);


    /* Run */
    console.log('neural network result', result);
    console.log('value of gen in dataset', X_test[50]);
}
init();
