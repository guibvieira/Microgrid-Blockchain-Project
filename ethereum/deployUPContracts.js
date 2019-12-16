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
const web3 = new Web3( new Web3.providers.HttpProvider("http://localhost:8545"));
const compiledExchange = require('./build/Exchange.json');

const deployExchange = async () => {
    const accounts = await web3.eth.getAccounts();

    console.log('Attempting to deploy from account', accounts[0])

    const result = await new web3.eth.Contract(JSON.parse(compiledExchange.interface))
        .deploy({ data: '0x' + compiledExchange.bytecode })
        .send({ gas: '1999999',from: accounts[0]});
    
    console.log('Contract Exchange deployed to', result.options.address);
};

deployExchange();
