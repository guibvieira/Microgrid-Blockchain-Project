let fs = require('fs');
let csv = require('fast-csv');
let parse = require('csv-parse');
let readCSV = require('./readFile');
let timeseries = require("timeseries-analysis");

const inputFile = '../data/household_26.csv'; // Data

async function loadData(inputFile){
    let resultSet = await readCSV(inputFile);
    return resultSet;
}

function deleteRow(arr, row) {
    arr = arr.slice(0); // make copy
    arr.splice(row, 1);
    return arr;
}

async function init(){
    let localminute = [];
    let use = [];
    let data = [];
    let csvData = await loadData(inputFile);
    csvData = deleteRow(csvData, 0);// remove header of file

    for (i=0; i<csvData.length/12; i++){
    
        localminute.push( csvData[i][0] );
        use.push( parseFloat(csvData[i][1]) );
        // let newDataPoint = {
        //     date: localminute,
        //     use: use
        // }
        data.push(new Array(csvData[i][0], parseFloat(csvData[i][1]))); 
    }
    let t = new timeseries.main(data);
    //var chart_url = t.ma({period: 14}).chart({main:true});
    

    //to chart with saved charts example
    //var chart_url = t.ma({period: 6}).save('moving average').reset().lwma({period:6}).save('LWMA').chart({main:true});

    
    // We calculate the AR coefficients of the 10 previous points
    var coeffs = t.ARMaxEntropy({
        data:	t.data.slice(0,10)
    });

    // // Now, we calculate the forecasted value of that 11th datapoint using the AR coefficients:
    var forecast	= 0;	// Init the value at 0.
    for (var i=0; i < coeffs.length;i++) {	// Loop through the coefficients
        forecast -= t.data[10-i][1]*coeffs[i];
        // Explanation for that line:
        // t.data contains the current dataset, which is in the format [ [date, value], [date,value], ... ]
        // For each coefficient, we substract from "forecast" the value of the "N - x" datapoint's value, multiplicated by the coefficient, where N is the last known datapoint value, and x is the coefficient's index.
    }
    console.log("forecast",forecast);
    console.log('actual value', data[10][1]);

    // The default method used is Max Entropy
    // t.sliding_regression_forecast({sample:20, degree: 5});
    // // Now we chart the results, comparing the the original data.
    // // Since we are using the past 20 datapoints to predict the next one, the forecasting only start at datapoint #21. To show that on the chart, we are displaying a red dot at the #21st datapoint:
    // var chart_url = t.chart({main:true,points:[{color:'ff1111',point:21,serie:0}]});
    // console.log('chart', chart_url);
    //console.log('point', points[{point:21}]);



}

init();


//Notes


//to make lines smoother
    // t.smoother({
    //     period:     8
    // });


//using the max entorpy method, to specify the degree, add {degree: 3} inside for example
// var coeffs = t.ARMaxEntropy();
// //using least square method
// var coeffs = t.ARLeastSquare();