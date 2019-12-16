
const plotly = require('plotly')("guibvieira", "oI36xfxoUbcdc5XR0pEK");



function slope(x1, y1, x2, y2) {
    if (x1 == x2) return false;
    return (y1 - y2) / (x1 - x2);
}

function yInt(x1, y1, x2, y2) {
    if (x1 === x2) return y1 === 0 ? 0 : false;
    if (y1 === y2) return y1;
    return y1 - slope(x1, y1, x2, y2) * x1 ;
}

function getIntersection(x11, y11, x12, y12, x21, y21, x22, y22) {
    var slope1, slope2, yint1, yint2, intx, inty;
    if (x11 == x21 && y11 == y21) return [x11, y11];
    if (x12 == x22 && y12 == y22) return [x12, y22];

    slope1 = slope(x11, y11, x12, y12);
    slope2 = slope(x21, y21, x22, y22);
    if (slope1 === slope2) return false;

    yint1 = yInt(x11, y11, x12, y12);
    yint2 = yInt(x21, y21, x22, y22);
    if (yint1 === yint2) return yint1 === false ? false : [0, yint1];

    if (slope1 === false) return [y21, slope2 * y21 + yint2];
    if (slope2 === false) return [y11, slope1 * y11 + yint1];
    intx = (slope1 * x11 + yint1 - yint2)/ slope2;
    return [intx, slope1 * intx + yint1];
}

function calculateIntersection(array1, array2){
    
    let array1DescendingPrice = [];
    let array2AscendingPrice = [];
    array1DescendingPrice = array1.sort(sortAscending); // bids
    array2AscendingPrice = array2.sort(sortAscending); //asks
    
    let x11 = array1DescendingPrice[0].amount;
    let y11 = array1DescendingPrice[0].price;
    let x12 = array1DescendingPrice[array1DescendingPrice.length-1].amount;
    let y12 = array1DescendingPrice[array1DescendingPrice.length-1].price;

    let x21 = array2AscendingPrice[0].amount;
    let y21 = array2AscendingPrice[0].amount;
    let x22 = array2AscendingPrice[array2AscendingPrice.length-1].amount;
    let y22 = array2AscendingPrice[array2AscendingPrice.length-1].price;

    let intersection = getIntersection(x11, y11, x12, y12, x21, y21, x22, y22);

    return intersection;
}
module.exports = calculateIntersection;

function sortDescending(a, b) {
    if (a.amount === b.price) {
        return 0;
    }
    else {
        return (a.price > b.price) ? -1 : 1;
    }
}

function sortAscending(a, b) {
    if (a.amount === b.amount) {
        return 0;
    }
    else {
        return (a.amount < b.amount) ? -1 : 1;
    }
}

function sortFunctionByAmount(a, b) {
    if (a[0] === b[0]) {
        return 0;
    }
    else {
        return (a[0] < b[0]) ? -1 : 1;
    }
}


//for tests use script below
// let array1 = [
//     [300, 0.08],
//     [500, 0.070],
//     [600, 0.075],
//     [1000, 0.11],
//     [1000, 0.085],
//     [1500, 0.95],
//     [1500, 0.12],
//     [1750, 0.10],
//     [2000, 0.09]];
    
// let array2 = [
//     [500, 0.1],
//     [700, 0.115],
//     [800, 0.135],
//     [900, 0.11],
//     [1000, 0.1375],
//     [1200, 0.12],
//     [1500, 0.125],
//     [1800, 0.105],
//     ];

// let array1DescendingPrice = [];
// let array2AscendingPrice = [];
// array1DescendingPrice = array1.sort(compareSecondColumnDescending); // bids
// array2AscendingPrice = array2.sort(compareSecondColumnAscending); //asks
// console.log('arra1 price', array1DescendingPrice);
// console.log('array2 price', array2AscendingPrice);

// array1 = array1DescendingPrice.sort(sortFunctionByAmount);
// array2 = array2AscendingPrice.sort(sortFunctionByAmount);

// console.log('array1 sorted by amount', array1);
// console.log('array2 sorted by amount', array2);


// let intersection = calculateIntersection(array1, array2);
// console.log('intersection', intersection);
// //for error in prediction
// let array1Amount = [];
// let array1Price = [];
// for (let i=0; i< array1DescendingPrice.length; i++){
//     array1Price.push(array1DescendingPrice[i][1]);
//     array1Amount.push(array1DescendingPrice[i][0]);
// }
// let array2Amount = [];
// let array2Price = [];
// for (let j=0; j< array2AscendingPrice.length; j++){
//     array2Price.push(array2AscendingPrice[j][1]);
//     array2Amount.push(array2AscendingPrice[j][0]);
// }

// var trace1 = {
//         x: array1Amount,
//         y: array1Price,
//         name: "yaxis data",
//         type: "scatter"
//     }
// var trace2 = {
//         x: array2Amount,
//         y: array2Price,
//         name: "yaxis data",
//         type: "scatter"
//     }
//     var data = [trace1, trace2];
//     var layout = {
//         title: 'Bids and Asks Intersection',
//         xaxis: {
//           title: 'Amount of elect. (Wh)',
//           titlefont: {
//             family: 'Courier New, monospace',
//             size: 18,
//             color: '#7f7f7f'
//           }
//         },
//         yaxis: {
//           title: 'Price (p/kWh)',
//           titlefont: {
//             family: 'Courier New, monospace',
//             size: 18,
//             color: '#7f7f7f'
//           }
//         }
//     };

//     var graphOptions = {layout: layout, filename: "prediction error", fileopt: "overwrite"};
//     plotly.plot(data, graphOptions, function (err, msg) {
//         console.log(msg);
//     });




// (function () {
//     window.linear = {
//         slope: function (x1, y1, x2, y2) {
//             if (x1 == x2) return false;
//             return (y1 - y2) / (x1 - x2);
//         },
//         yInt: function (x1, y1, x2, y2) {
//             if (x1 === x2) return y1 === 0 ? 0 : false;
//             if (y1 === y2) return y1;
//             return y1 - this.slope(x1, y1, x2, y2) * x1 ;
//         },
//         getXInt: function (x1, y1, x2, y2) {
//             var slope;
//             if (y1 === y2) return x1 == 0 ? 0 : false;
//             if (x1 === x2) return x1;
//             return (-1 * ((slope = this.slope(x1, y1, x2, y2)) * x1 - y1)) / slope;
//         },
//         getIntersection: function (x11, y11, x12, y12, x21, y21, x22, y22) {
//             var slope1, slope2, yint1, yint2, intx, inty;
//             if (x11 == x21 && y11 == y21) return [x11, y11];
//             if (x12 == x22 && y12 == y22) return [x12, y22];

//             slope1 = this.slope(x11, y11, x12, y12);
//             slope2 = this.slope(x21, y21, x22, y22);
//             if (slope1 === slope2) return false;

//             yint1 = this.yInt(x11, y11, x12, y12);
//             yint2 = this.yInt(x21, y21, x22, y22);
//             if (yint1 === yint2) return yint1 === false ? false : [0, yint1];

//             if (slope1 === false) return [y21, slope2 * y21 + yint2];
//             if (slope2 === false) return [y11, slope1 * y11 + yint1];
//             intx = (slope1 * x11 + yint1 - yint2)/ slope2;
//             return [intx, slope1 * intx + yint1];
//         }
//     }
// }());