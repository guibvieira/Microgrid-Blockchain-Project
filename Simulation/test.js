// // Data

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



