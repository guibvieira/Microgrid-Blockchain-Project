const brain = require('brain.js');
const readCSV = require('./readFile');
const plotly = require('plotly')('guibvieira', 'oI36xfxoUbcdc5XR0pEK');


function getCol(matrix, col){
  var column = [];
  for(var i=0; i<matrix.length; i++){
     column.push(matrix[i][col]);
  }
  return column;
}

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
  let data = new Array();
  console.log('lengt',householdData.length );
  //prepare the data
  for (i=1; i<householdData.length; i++){
      X_train.push(new Array(parseFloat(householdData[i][3]), parseFloat(householdData[i][4]), parseFloat(householdData[i][5]), parseFloat(householdData[i][6]), parseFloat(householdData[i][7]), parseFloat(householdData[i][8]), parseFloat(householdData[i][9]),parseFloat(householdData[i][10]), parseFloat(householdData[i][11]), parseFloat(householdData[i][12]), parseFloat(householdData[i][13]), parseFloat(householdData[i][14]), parseFloat(householdData[i][15]) )  );
      //X_train.push(new Array(parseFloat(householdData[i][3]), parseFloat(householdData[i][4]), parseFloat(householdData[i][5]) )  );
      X_test.push( parseFloat(householdData[i][2] ));
      
  }
  for (j=0; j< X_train.length/52; j++){
    let newData = {
      input: X_train[j],
      output: [X_test[j]]
    }
    data.push(newData);
    
  }
  // let newData = {
  //   input: new Array(parseFloat(householdData[j][3]), parseFloat(householdData[j][4]), parseFloat(householdData[j][5]) ),
  //   output: [parseFloat(householdData[j][2])]
  // }
  // data.push(newData);
console.log('data', X_train[2]);
let options = {
  // Defaults values --> expected validation
iterations: 200000,    // the maximum times to iterate the training data --> number greater than 0
errorThresh: 0.001,   // the acceptable error percentage from training data --> number between 0 and 1
log: false,           // true to use console.log, when a function is supplied it is used --> Either true or a function
logPeriod: 10,        // iterations between logging out --> number greater than 0
learningRate: 0.3,    // scales with delta to effect training rate --> number between 0 and 1
momentum: 0.1,        // scales with next layer's change value --> number between 0 and 1
callback: null,       // a periodic call back that can be triggered while training --> null or function
callbackPeriod: 10,   // the number of iterations through the training data between callback calls --> number greater than 0
timeout: Infinity     // the max number of milliseconds to train for --> number greater than 0
};

var net = new brain.NeuralNetwork();
console.log('xtrain at 0:', X_train[0]);
console.log('xtrain at 0:', X_test[0]);
console.log('before training');


net.train(data, options);
let output =[];
let actualOutput =[];

for(k=0; k<169; k++){
  output[k] = net.run( X_train[k]);  // { white: 0.99, black: 0.002 }
  actualOutput[k] = X_test[k];
  timeArray[k] = k;
}

 //for error in prediction
var trace1 = {
  x: timeArray,
  y: output,
  name: "predicted output",
  type: "scatter"
}
var trace2 = {
  x: timeArray,
  y: actualOutput,
  name: "actual output",
  type: "scatter"
}

var dataGraph = [trace1, trace2];


var graphOptions = {filename: "prediction error nn", fileopt: "overwrite"};
plotly.plot(dataGraph, graphOptions, function (err, msg) {
  console.log(msg);
});

}


init();