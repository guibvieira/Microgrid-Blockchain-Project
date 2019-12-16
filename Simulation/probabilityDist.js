// var gaussian = require('./gaussian');

// var distribution = gaussian(0.08, 0.005);
// // Take a random sample using inverse transform sampling method.
// var sample = distribution.ppf(Math.random());
// console.log('random value', Math.random());
// console.log('sample', sample);
function getDistributionParameters(minPrice, maxPrice){
    let mean = (minPrice + maxPrice) / 2;
    let stdev = (- minPrice + mean) / 2;
    return { mean, stdev }

}

// returns a gaussian random function with the given mean and stdev.
function gaussian(mean, stdev) {
    var y2;
    var use_last = false;
    return function() {
        var y1;
        if(use_last) {
           y1 = y2;
           use_last = false;
        }
        else {
            var x1, x2, w;
            do {
                 x1 = 2.0 * Math.random() - 1.0;
                 x2 = 2.0 * Math.random() - 1.0;
                 w  = x1 * x1 + x2 * x2;               
            } while( w >= 1.0);
            w = Math.sqrt((-2.0 * Math.log(w))/w);
            y1 = x1 * w;
            y2 = x2 * w;
            use_last = true;
       }

       var retval = mean + stdev * y1;
       if(retval > 0) 
           return retval;
       return -retval;
   }
}
let {mean, stdev} = getDistributionParameters(0.03, 0.13);
console.log(`mean is ${mean} and stdev is ${stdev}`);
// make a standard gaussian variable.     
let standard = gaussian(mean, stdev);
let result=getCorrectValue();
console.log('result', standard());
// make a bunch of standard variates
// for(i=0; i<2000; i++) {
//     let value = standard();
//     if(value< 0.03){
//         standard();
//     }
// }
let bool = false

function getCorrectValue(){
    let value = standard();
    while(value<0.13 && value>0.03){
        return value;
    }
}


