//Using ganache
const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
// const web3 = new Web3(ganache.provider());
const web3 = new Web3( new Web3.providers.HttpProvider("http://localhost:8545"))
const Agent = require('../models/agentSimulation.js');
const readCSV = require('../Simulation/readFile.js');

//compiled contracts
const exchange = require('../ethereum/exchange');

let household;
let agentAccount;
let agent;
let agentBalance;
let date;
let accounts;

beforeEach(async() => {

    accounts = await web3.eth.getAccounts();
 
    //create agent instance
    agent = new Agent(5000, false);

    agentAccount = await agent.getAccount(0);
    agentBalance = await agent.getAgentBalance();
   
});

describe('Agents', () => {

    it('can place 100 bids without an error', async () =>{
        try{
            for(i=0; i<=100; i++){
                date = (new Date).getTime();
                console.log(`${i}'th transaction`);
                await agent.placeAsk(10, 1000, date);
                agentBalance = await agent.getAgentBalance();
                console.log('its balance is', agentBalance);
            }
            
            
        }catch(err){
            console.log(err);
        }
        let newAsksCount = 0;
        let bidsCount = await exchange.methods.getBidsCount().call();
        let asksCount = await exchange.methods.getAsksCount().call();
        accounts = await web3.eth.getAccounts();
        console.log(`before clearing market and there are ${bidsCount} bids and ${asksCount} asks`);
        for (let i = asksCount - 1; i >= 0; i--) {
            console.log('im inside the loop');
            newAsksCount = await exchange.methods.removeAsk(i).send({
                from: accounts[accounts.length-1],
                gas: '2000000'
            });
            console.log('newAsksCount', newAsksCount);
   
        }
        
        bidsCount = await exchange.methods.getBidsCount().call();
        asksCount = await exchange.methods.getAsksCount().call();

        console.log(`i just cleared market and there are ${bidsCount} bids and ${asksCount} asks`);
            
        
    });



});