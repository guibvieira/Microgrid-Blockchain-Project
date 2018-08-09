
const DTregressor = require('ml-cart');
const readCSV = require('./readFile');
const plotly = require('plotly')('guibvieira', 'oI36xfxoUbcdc5XR0pEK');

async function loadData(inputFile){
    let resultSet = await readCSV(inputFile);
    return resultSet;
  }
  async function init(){
    inputFile = '../data/household_26.csv';
    householdData = await loadData(inputFile);
  
    var X_train = new Array();
    var X_test = new Array();
    let timeArray = new Array();
    let useData = new Array();
    let predictorTest = new Array();
    console.log('lengt',householdData.length );
    //prepare the data
    for (i=1; i<householdData.length/300; i++){
        X_train.push(parseFloat(householdData[i][6]));
        //X_train.push(new Array(parseFloat(householdData[i][3]), parseFloat(householdData[i][4]), parseFloat(householdData[i][5]) )  );
        X_test.push( parseFloat(householdData[i][2] ));
        
    }

    for (j=X_train.length; j< X_train.length*2; j++){
        predictorTest.push(parseFloat(householdData[j][6]));
        useData.push(parseFloat(householdData[j][2]));
        
      }
    console.log('xtrain', X_train.length);
    console.log('predictor test', predictorTest);


    var reg = new DTregressor.DecisionTreeRegression();
    reg.train(X_train, X_test);
    var estimations = reg.predict(predictorTest[0]);
    console.log('estimations', estimations);

    let output =[];
    let actualOutput =[];

    // for(k=0; k<X_train.length*2; k++){
    // actualOutput[k] = X_test[k];
    // timeArray[k] = k;
    // }

    // //for error in prediction
    // var trace1 = {
    // x: timeArray,
    // y: estimations,
    // name: "predicted output",
    // type: "scatter"
    // }
    // var trace2 = {
    // x: timeArray,
    // y: useData,
    // name: "actual output",
    // type: "scatter"
    // }

    // var dataGraph = [trace1, trace2];


    // var graphOptions = {filename: "prediction error nn", fileopt: "overwrite"};
    // plotly.plot(dataGraph, graphOptions, function (err, msg) {
    // console.log(msg);
    // });
}
init();