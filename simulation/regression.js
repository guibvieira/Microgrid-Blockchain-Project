const regression = require('regression');

array1= [[0, 1], [32, 67], [12, 79]];
const result = regression.linear(array1);
const gradient = result.equation[0];
const yIntercept = result.equation[1];



console.log('gradient', gradient);
console.log('yintercept', yIntercept);

let array2 = [[0, 42], [12, 30], [30, 6]];
const result2 = regression.linear(array2);
const gradient2 = result.equation[0];
const yIntercept2 = result.equation[1];

console.log('array2 lenght', array2.length);




// function intersects(a,b,c,d,p,q,r,s) {
//     var det, gamma, lambda;
//     det = (c - a) * (s - q) - (r - p) * (d - b);
//     if (det === 0) {
//       return false;
//     } else {
//       lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
//       gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
//       return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
//     }
// };


// let interception = intersects(x11,y11,x12,y12, x21, y21, x22, y22);
let x11 = array1[0][0];
let y11 = array1[0][1];
let x12 = array1[array1.length-1][0];
let y12 = array1[array1.length-1][1];

let x21 = array2[0][0];
let y21 = array2[0][1];
let x22 = array2[array2.length-1][0];
let y22 = array2[array2.length-1][1];

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

let intersection = getIntersection(x11, y11, x12, y12, x21, y21, x22, y22);

console.log('intersection', intersection);

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