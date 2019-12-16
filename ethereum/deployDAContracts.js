//Using infura
// const HDWalletProvider = require('truffle-hdwallet-provider');
// const Web3 = require('web3');
// const compiledFactory = require('./build/HouseholdFactory.json');
// const compiledExchange = require('./build/Exchange.json');

// const provider = new HDWalletProvider('pulse stable fever half settle phone impact theory crater grit chef census',
//                                     'https://rinkeby.infura.io/v3/ec8b3999af1c4c32a5ab8d98b303d3ba'
// );
// const web3 = new Web3(provider);


//Using ganache
const ganache = require('ganache-cli');
const Web3 = require('web3');
let fs = require('fs');
var csv = require("fast-csv");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const compiledFactory = require('./build/HouseholdFactory.json');
const compiledExchange = require('./build/Exchange.json');
const Exchange = require('./build/Exchange.json');
const fileName = 'deployedAddresses.csv';

// const deployFactory = async () => {
async function init() {
    async function deployFactory() {
        const accounts = await web3.eth.getAccounts();

        console.log('Attempting to deploy from account', accounts[accounts.length - 1]);

        const result = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
            .deploy({ data: '0x' + compiledFactory.bytecode })
            .send({ gas: '1999999', from: accounts[accounts.length - 1] });

        console.log('Contract Factory deployed to', result.options.address);
        return result.options.address;
    };

    //const deployExchange = async () => {
    async function deployExchange() {
        const accounts = await web3.eth.getAccounts();

        console.log('Attempting to deploy from account', accounts[accounts.length - 1]);

        const result = await new web3.eth.Contract(JSON.parse(compiledExchange.interface))
            .deploy({ data: '0x' + compiledExchange.bytecode })
            .send({ gas: '1999999', from: accounts[accounts.length - 1] });

        console.log('Contract Exchange deployed to', result.options.address);
        return result.options.address;
    };

    let exchangeAddress = await deployExchange();
    let factoryExchange = await deployFactory();

    let csvData = [{
        exchange: exchangeAddress,
        factory: factoryExchange
    }]

    const ws = fs.createWriteStream(fileName);
    csv
        .write(csvData, { headers: true })
        .pipe(ws);
}
init();

