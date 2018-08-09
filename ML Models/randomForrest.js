//import { RandomForestRegression as RFRegression } from 'ml-random-forest';
const RFRegression = require('ml-random-forest');

const readCSV = require('./readFile');
const plotly = require('plotly')('guibvieira', 'oI36xfxoUbcdc5XR0pEK');


// var dataset = [
//     [73, 80, 75, 152],
//     [93, 88, 93, 185],
//     [89, 91, 90, 180],
//     [96, 98, 100, 196],
//     [73, 66, 70, 142],
//     [53, 46, 55, 101],
//     [69, 74, 77, 149],
//     [47, 56, 60, 115],
//     [87, 79, 90, 175],
//     [79, 70, 88, 164],
//     [69, 70, 73, 141],
//     [70, 65, 74, 141],
//     [93, 95, 91, 184],
//     [79, 80, 73, 152],
//     [70, 73, 78, 148],
//     [93, 89, 96, 192],
//     [78, 75, 68, 147],
//     [81, 90, 93, 183],
//     [88, 92, 86, 177],
//     [78, 83, 77, 159],
//     [82, 86, 90, 177],
//     [86, 82, 89, 175],
//     [78, 83, 85, 175],
//     [76, 83, 71, 149],
//     [96, 93, 95, 192],
//     [78, 83, 77, 159],
//     [82, 86, 90, 177],
//     [86, 82, 89, 175],
//     [78, 83, 85, 175],
//     [76, 83, 71, 149],
//     [78, 83, 77, 159],
//     [82, 86, 90, 177],
//     [86, 82, 89, 175],
//     [78, 83, 85, 175],
//     [76, 83, 71, 149],
//     [78, 83, 77, 159],
//     [82, 86, 90, 177],
//     [86, 82, 89, 175],
//     [78, 83, 85, 175],
//     [76, 83, 71, 149],
//     [78, 83, 77, 159],
//     [82, 86, 90, 177],
//     [86, 82, 89, 175],
//     [78, 83, 85, 175],
//     [76, 83, 71, 149],
//     [78, 83, 77, 159],
//     [82, 86, 90, 177],
//     [86, 82, 89, 175],
//     [78, 83, 85, 175],
    
   
//   ];
let dataset = [
//   [ 0, 0, 0 ],
//   [ 0, 0, 0 ],
//   [ 0, 0, 0 ],
//   [ 0, 0, 0 ],
//   [ 0, 0, 0 ],
//   [ 0, 0, 0 ],
//   [ 0, 0, 0 ],
//   [ 0, 0, 0 ],
//   [ 0, 0, 0.286 ],
//   [ 0, 0, 0.725 ],
//   [ 0, 0, 0.884 ],
//   [ 0, 0, 1.888 ],
//   [ 0, 0, 1.243 ],
//   [ 0, 0, 0.99 ],
  [ 0, 57, 0.828 ],
  [ 0, 83, 0.279 ],
   [ 70, 95, 0.102 ],
 //  [ 360, 99, 0.013 ],
//   [ 21, 101, 0 ],
//   [ 0, 98, 0 ],
//   [ 31, 92, 0 ],
//   [ 0, 80, 0 ],
//   [ 0, 58, 0 ],
//   [ 0, 12, 0 ] 
];

  
  var trainingSet = new Array(dataset.length);
  var predictions = new Array(dataset.length);
  
  for (var i = 0; i < dataset.length; ++i) {
    trainingSet[i] = dataset[i].slice(0, 2);
    calc=  dataset[i][2]*100;
    predictions[i] = + parseInt(calc).toFixed(0);
  }
  
  var options = {
    seed: 3,
    maxFeatures: 1,
    replacement: false,
    nEstimators: 200
  };
  console.log('training set',  trainingSet);
  console.log('test set',  predictions);
  var regression = new RFRegression.RandomForestRegression(options);
  regression.train(trainingSet, predictions);
  var result = regression.predict(trainingSet);
  console.log('result', result);

// async function loadData(inputFile){
//     let resultSet = await readCSV(inputFile);
//     return resultSet;
// }
// async function init(){
//     inputFile = '../data/household_26.csv';
//     householdData = await loadData(inputFile);

//     //console.log('household data', householdData)

//     var X_train = new Array();
//     var X_test = new Array();
//     let timeArray = new Array();

//     // for (var i = 1; i < householdData.length; ++i) {
//     //     trainingSet[i] = householdData[i].slice(3, 15);
//     //     predictions[i] = householdData[i][2];
//     // }
    
//     //  predictions = predictions.join(' ').split(' ').map(parseFloat);
//     //  trainingSet = trainingSet.join(' ').split(' ').map(parseFloat);
//     //console.log('household data', householdData);
//     //prepare the data
//     for (i=1; i<householdData.length/365; i++){
//         //X_train.push(new Array(parseFloat(householdData[i][3]), parseFloat(householdData[i][4]), parseFloat(householdData[i][5]), parseFloat(householdData[i][6]), parseFloat(householdData[i][7]), parseFloat(householdData[i][8]), parseFloat(householdData[i][9]),parseFloat(householdData[i][10]), parseFloat(householdData[i][11]), parseFloat(householdData[i][12]), parseFloat(householdData[i][13]), parseFloat(householdData[i][14]), parseFloat(householdData[i][15]) )  );
//         X_train.push(new Array(+ parseFloat(householdData[i][8]).toFixed(5), + parseFloat(householdData[i][10]).toFixed(3), + parseFloat(householdData[i][2]).toFixed(3)  ));
//     }
    
//     var trainingSet = new Array(X_train.length);
//     var predictions = new Array(X_train.length);
//     console.log('xtrain', X_train);
//     for (var i = 0; i < X_train.length; ++i) {
//         trainingSet[i] = X_train[i].slice(0, 2);
//         predictions[i] = X_train[i][2];
//     }

//     console.log('training set', trainingSet);
    
//     console.log('predictions',  predictions);


//     var options = {
//     seed: 3,
//     maxFeatures: 2,
//     replacement: false,
//     nEstimators: 100
//     };

//     var regression = new RFRegression.RandomForestRegression(options);

//     regression.train(trainingSet, predictions);
//     console.log('im before the error');
//     var result = regression.predict(trainingSet);
//     console.log('result', result);

//     for(i=0; i< X_test.length; i++){
//         timeArray.push(i);
//     }

//     var trace1 = {
//         x: timeArray,
//         y: result,
//         name: "prediction",
//         type: "scatter"
//     }
//     var trace2 = {
//         x: timeArray,
//         y: X_test,
//         name: "actual data",
//         type: "scatter"
//     }
//     var data = [trace1, trace2];


//     var graphOptions = {filename: "prediction error random forest", fileopt: "overwrite"};
//     plotly.plot(data, graphOptions, function (err, msg) {
//         console.log(msg);
//     });
// }

// init();