const web3 = require('./ethereum/web3');

let date = (new Date()).getTime();
let birthDateInUnixTimestamp = date ;
console.log(birthDateInUnixTimestamp);
// let time = new Date().getTime();
// let date = new Date(time);
// let d = date.toLocaleString();
// d=web3.utils.fromAscii(d);
// let f=web3.utils.toUtf8(d);
// console.log('bytes', d)
// console.log('string', f);

// let bytesToString = web3.utils.toUtf8(0x323031382d372d32362031393a35373a35320000000000000000000000000000);
// console.log(bytesToString);