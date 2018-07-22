// import Web3 from 'web3';
const Web3 = require('./web3');


let web3

if (typeof window !== 'undefined' && typeof window.web3 !== 'undefined') {
    //we are in the browser and metamask is running
    web3 = new Web3(window.web3.currentProvider)
} else {
    //we are on the server OR the user is not running metamask
    const provider = new Web3.providers.HttpProvider(
        'https://rinkeby.infura.io/v3/ec8b3999af1c4c32a5ab8d98b303d3ba'
    );
    web3 = new Web3(provider);
};

//window is a global var that is only available inside the browse, not available in node.js where our server is currently running (window error explanation)
//can't assume that the var window will be defined in other servers
// what we had --> const web3 = new Web3(window.web3.currentProvider);//give it the provider from metamask
//'https://rinkeby.infura.io/YDnIBMV5OY1S3hf9iVWn'

// export default web3;
module.exports = web3;