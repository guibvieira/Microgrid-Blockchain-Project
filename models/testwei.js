const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3 ( new Web3.providers.HttpProvider("http://localhost:8545"));
let calcPrice = 0.000215648581528442.toFixed(18);
console.log('calcprice', calcPrice);
console.log('type of calcprice', typeof calcPrice);
        price = web3.utils.toWei(calcPrice, 'ether');
        console.log('price in wei', price);
        price = parseInt(price)
;        console.log('type', typeof price);
