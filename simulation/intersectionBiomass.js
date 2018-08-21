const plotly = require('plotly')('guibvieiraProject', 'Whl2UptBOq1gMvQrRGHk');
const regression = require('regression');
const algebra = require('algebra.js');
var Fraction = algebra.Fraction;
var Expression = algebra.Expression;
var Equation = algebra.Equation;
//const {convertArrayGasToPounds, convertArrayWeiToPounds, convertWeiToPounds, convertGasToPounds} = require('./conversions.js');
const WEI_IN_ETHER = 1000000000000000000;
const PRICE_OF_ETHER = 250;


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

function setCharAt(str,index,chr) {
    if(index > str.length-1) return str;
    return str.substr(0,index) + chr + str.substr(index+1);
}

function nthIndex(str, pat, n){
    var L= str.length, i= -1;
    while(n-- && i++<L){
        i= str.indexOf(pat, i);
        if (i < 0) break;
    }
    return i;
}

function calculateIntersection(array1, array2){
    
    let array1DescendingPrice = [];
    let array2AscendingPrice = [];
    array1DescendingPrice = array1.sort(sortDescending); // bids
    array2AscendingPrice = array2.sort(sortAscending); //asks
    // let x11 = array1DescendingPrice[0].amount;
    // let y11 = array1DescendingPrice[0].price;
    // let x12 = array1DescendingPrice[array1DescendingPrice.length-1].amount;
    // let y12 = array1DescendingPrice[array1DescendingPrice.length-1].price;

    // let x21 = array2AscendingPrice[0].amount;
    // let y21 = array2AscendingPrice[0].amount;
    // let x22 = array2AscendingPrice[array2AscendingPrice.length-1].amount;
    // let y22 = array2AscendingPrice[array2AscendingPrice.length-1].price;

    // let intersection = getIntersection(x11, y11, x12, y12, x21, y21, x22, y22);
    let intersection = [ 0, 0];
    let array1x = new Array();
    let array1y = new Array();
    let array2x = new Array();
    let array2y = new Array();



    let array1Polynomial = new Array();
    let array2Polynomial = new Array();


    let array1xsub = Array(array1DescendingPrice.length).fill(0);

    let array2xsub = new Array()
    

    for(let i = 0; i< array1DescendingPrice.length; i++) {
        for(let j = 0; j <= i; j++) {
            array1xsub[i] += array1DescendingPrice[j].amount;
        }
        array1x.push(array1DescendingPrice[i].amount);
        array1y.push(array1DescendingPrice[i].price);
        array1Polynomial.push(new Array(array1xsub[i], array1y[i]));
        
    }

    array2xsub.push(0);
    array2y.push(0);
    array2Polynomial.push(new Array(array2xsub[0], array2y[0]));
    
    for(let i = 0;  i < array2AscendingPrice.length; i++) {
        let value = 0;
        for(let j = 0; j <= i; j++) {
            value += array2AscendingPrice[j].amount;
        }
        array2xsub.push(value); 
        array2x.push(array2AscendingPrice[i].amount);
        array2y.push(array2AscendingPrice[i].price);
        array2Polynomial.push(new Array(array2xsub[i + 1], array2y[i + 1])); 
        
    }

    // const result1 = regression.polynomial(array1Polynomial, { order: 1 });
    // const result2 = regression.polynomial(array2Polynomial, { order: 1 });
    const result1 = regression.linear(array1Polynomial)
    const result2 = regression.linear(array2Polynomial);

    let equation1 = result1.string;
    let equation2 = result2.string;

    equation1 = equation1.replace(/\+ -/g, "-");
    equation1 = equation1.replace("y =", "");

    equation2 = equation2.replace(/\+ -/g, "-");
    equation2 = equation2.replace("y =", "");
    
    let equationFinal = `${equation1} = ${equation2}`;
    
    //put into equation and solve
    var eq = new algebra.parse(equationFinal);
    var ans = eq.solveFor("x");
    let possibleIntersections = [];
    ans  =  ans.numer  / ans.denom;
    let tempResult = result1.predict(ans);
    intersection = tempResult;

    // for(let i = 0; i < ans.length; i++) {
    //     if(ans > 0) {
    //         let tempResult = result1.predict(ans);
    //         console.log('tempresult', tempResult);
    //         if(tempResult[1] > 0) {
    //             possibleIntersections.push( parseInt( tempResult[1]));
    //         }
    //     }
    // }
    //console.log('possible intersections', possibleIntersections)
    //let minimum = Math.min(...possibleIntersections);

    let minimum = tempResult[1];
    
    if(minimum == Infinity || minimum == undefined) {
        minimum = 240000000000000;
    }
    intersection[1] = parseInt(minimum);

    function convertArrayWeiToPounds(arrayWei, WEI_IN_ETHER, priceOfEther) {
        let tempArray = new Array();

        for(let i=0; i<arrayWei.length; i++) {
            let costEther = arrayWei[i] / WEI_IN_ETHER;
            let costPounds = costEther * ( parseFloat(priceOfEther.toFixed(18)));
            costPounds = parseFloat(costPounds.toFixed(3));
            tempArray.push(costPounds);
        }
        
        return tempArray;
    }
    
    array1y = convertArrayWeiToPounds(array1y, WEI_IN_ETHER , PRICE_OF_ETHER);
    array2y = convertArrayWeiToPounds(array2y, WEI_IN_ETHER , PRICE_OF_ETHER);

    // var trace1 = {
    //         x: array1xsub,
    //         y: array1y,
    //         name: "bids",
    //         type: "scatter"
    //     }
    // var trace2 = {
    //         x: array2xsub,
    //         y: array2y,
    //         name: "asks",
    //         type: "scatter"
    //     }
    // var data = [trace1, trace2];
    // var layout = {
    //         title: 'Bids and Asks Intersection',
    //         xaxis: {
    //         title: 'Quantity of Electricity (Wh)',
    //         titlefont: {
    //             family: 'Courier New, monospace',
    //             size: 18,
    //             color: '#7f7f7f'
    //         }
    //         },
    //         yaxis: {
    //         title: 'Price (p/kWh)',
    //         titlefont: {
    //             family: 'Courier New, monospace',
    //             size: 18,
    //             color: '#7f7f7f'
    //         }
    //         }
    // };

    // var graphOptions = {layout: layout, filename: "Intersection Demand and Supply", fileopt: "overwrite"};
    // plotly.plot(data, graphOptions, function (err, msg) {
    //     console.log(msg);
    // });
    // var csvStream = csv.createWriteStream({ headers: true }),
    // writableStream = fs.createWriteStream('intersection');

    // writableStream.on("finish", function () {
    //     console.log("DONE!");
    // });
    
    // csvStream.pipe(writableStream);
    // for(let i = 0; i < csvData.length; i++){
    // csvStream.write(csvData[i]);
    // }
    // csvStream.end();

    return intersection;
}

function sortDescending(a, b) {
    if (a.price === b.price) {
        return 0;
    }
    else {
        return (a.price > b.price) ? -1 : 1;
    }
}

function sortAscending(a, b) {
    if (a.price === b.price) {
        return 0;
    }
    else {
        return (a.price < b.price) ? -1 : 1;
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
// let array1Amount = new Array();
// let array1Price = new Array();
// for (let i=0; i< array1DescendingPrice.length; i++){
//     array1Price.push(array1DescendingPrice[i][1]);
//     array1Amount.push(array1DescendingPrice[i][0]);
// }
// let array2Amount = new Array();
// let array2Price = new Array();
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

module.exports = calculateIntersection;


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