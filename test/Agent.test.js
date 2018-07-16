//import web3 from '../ethereum/web3';
//const web3 = require('../ethereum/web3');
// const factory = require('../ethereum/factory');
// const exchange = require('../ethereum/exchange');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());
const Agent = require('../models/agent.js');
const assert = require('assert');



beforeEach(async() => {
    accounts = await web3.eth.getAccounts();
    //console.log(accounts);

});

describe('Agents', () => {

    it('deploy an instance of Agent and check if you can access ethereumAddress', async () =>{
        let agent = new Agent(5000);

        
        console.log(agent.currentDate);
        await agent.getAccount(0);

        console.log('ethereum address:', agent.ethereumAddress);
        
        await agent.getAgentBalance();
    
        console.log('agent balance', agent.balance);

        try{
        await agent.deployContract(5000).then(function(result){
            console.log('deployed contract successful', result);
        });
        console.log('deployed contract', agent.householdAddress);
        }catch(err){
            console.log(err);
        }
    });
});