// // Data
const ganache = require('ganache-cli');
const Web3 = require('web3');
web3 = new Web3( new Web3.providers.HttpProvider("http://localhost:8545"));
let fastcsv = require('fast-csv');
var fs = require('fs');

const regression = require('regression');
const algebra = require('algebra.js');
var Fraction = algebra.Fraction;
var Expression = algebra.Expression;
var Equation = algebra.Equation;

const GASPRICE = 2000000000; //wei
const simulationDays = 1;  // input
const PRICE_OF_ETHER = 250; 
const NATIONAL_GRID_PRICE = 0.1437; //input
const BIOMASS_PRICE_MIN = 0.06; //input
const BIOMASS_PRICE_MAX = 0.12; //input
const WEI_IN_ETHER = 1000000000000000000;

let costPounds = 496358625023;
let result=  costPounds.toFixed(3);

console.log('result', typeof result);// String.prototype.replaceAt=function(index, replacement) {
//     return this.substr(0, index) + replacement+ this.substr(index + replacement.length);
// }

// function setCharAt(str,index,chr) {
//     if(index > str.length-1) return str;
//     return str.substr(0,index) + chr + str.substr(index+1);
// }

// function nthIndex(str, pat, n){
//     var L= str.length, i= -1;
//     while(n-- && i++<L){
//         i= str.indexOf(pat, i);
//         if (i < 0) break;
//     }
//     return i;
// }


// var address1 = {id: 124, agent: 'bla', address: 0xb181FB52b6e5Ee5915fdB3ad678E0b8a753C3bd3};
// var addressx = address1;
// var address2 = {id: 314, agent: 'bla', address: 0xA1B0d2152E36ebd2ac8e4FC3309cF093E28B1F5c};
// var address3 = {id: 172, agent: 'bla', address: 0x4DD1680B58B821C5c631f56D9280Ccc9c3051377};
// var address4 = {id: 314, agent: 'dd', address: 0xA1B0d2152E36ebd2ac8e4FC3309cF093E28B1F5c};
// var address5 = {id: 172, agent: 'tugga', address: 0x4DD1680B58B821C5c631f56D9280Ccc9c3041377};
// var address6 = {id: 314, agent: 'bla', address: 0xA1B0d2152E36ebd2ac8e4FC3309cF093E28B1F5c};
// var address7 = {id: 172, agent: 'bla', address: 0x4DD1680B5821C5c631f56D9280Ccc9c345051377};
// var address8 = {id: 314, agent: 'bla', address: 0xA1B0d2152E36ebd2ac8e4FC3309cF093444B1F5c};
// var address9 = {id: 172, agent: '33la', address: 0x4DD1680B58B821C5c631f56D9280Ccc9c4051377};

// // var x = ["a","b","c","t"];
// // var y = ["d","a","t","e","g"];
// var x = [address1,address2,address3,address4, address5, address6, address7];
// var y = [address2, address5, addressx, address8, address9];



// let myArray = y.filter( el => {
  
//   if (x.indexOf( el ) < 0) {
//     console.log('el address', el.address);
//     return el.address;
//   }
// });
// console.log('my array', myArray);

// let historicalDemand = [
//     [1.432789,2.342789],
//     [2.234679,3.4372809],
//     [3,4.437289],
//     [4,5.547389],
//     [5,6.437289],
//     [6,7.123578],
//     [8,9.1623785],
//     [12,3.1723489],
//     [43,65]
// ]
// function predictorRandom(row){
//     let timeInterval = 5;
//         let randomArray = new Array();
//         if( row <= timeInterval){
//             return historicalDemand[row];
//         }
//         for(i=row-timeInterval; i < row; i++){
//             randomArray.push(historicalDemand[i][1]);
//         }
//         return randomArray[Math.floor(Math.random() * randomArray.length)];
// }
// function predictorAverage(){
//     let timeInterval = 5; //5 hours of time interval
//     let averageArray = new Array();
//     let timeRow = 6;

//     if( timeRow <= timeInterval){
//         console.log('predictor average return value', historicalDemand[timeRow])
//         return historicalDemand[timeRow][1];
//     }

//     for(let i= timeRow-timeInterval; i < timeRow; i++){
//         averageArray.push(historicalDemand[i][1]);
//     }
//     console.log('average array', averageArray);
//     return averageArray.reduce((a, b) => a + b, 0)/timeInterval;
// }
// console.log(predictorAverage());



