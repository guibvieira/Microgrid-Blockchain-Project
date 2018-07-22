//Using ganache
const assert = require('assert');
const ganache = require('ganache-cli');
// const Web3 = require('web3');
// const web3 = new Web3( new Web3.providers.HttpProvider("http://localhost:8545"));
const web3 = require('../ethereum/web3-ganache.js');

const Agent = require('../models/agent.js');

//compiled contracts
const compiledHousehold = require('../ethereum/build/Household.json');
const factory = require('../ethereum/factory');
const exchange = require('../ethereum/exchange');

let household;
let agentAccount;
let agent;
let agentBalance;

beforeEach(async() => {
    accounts = await web3.eth.getAccounts();
    console.log(accounts[0]);
    //create agent instance
    agent = new Agent(5000);

    agentAccount = await agent.getAccount();
    console.log(agent.ethereumAddress);
    agentBalance = await agent.getAgentBalance();
    console.log(agent.balance);

    household = await agent.deployContract(5000);

});

describe('Agents', () => {

    it('deploy an instance of Agent and check if you can access ethereumAddress and deposited balance', async () =>{

        console.log('contract address', agent.householdAddress);
        
        let exchangeAddress= await agent.newHousehold.methods.exchangeAddress().call();
        let balance= await web3.eth.getBalance(agent.householdAddress);
        assert(exchangeAddress, exchange.options.address );
        assert(web3.utils.fromWei('2', 'ether'), balance);
        
    });

    it('can charge and discharge an existing Contract of Agent', async () =>{
        let preChargeAmount = await agent.newHousehold.methods.amountOfCharge().call();

        await agent.chargeContract(1000);

        let postChargeAmount =  await agent.newHousehold.methods.amountOfCharge().call();
        await agent.dischargeContract(2000);
        let postDischargeAmount = await agent.newHousehold.methods.amountOfCharge().call();

        assert(postChargeAmount-1000, preChargeAmount);
        assert(postDischargeAmount+2000, postChargeAmount);
    });

    it('can place a Buy and a Sell', async() =>{
        await agent.placeBuy(10,1000);
        await agent.placeAsk(11,1000);

        let bid = await exchange.methods.getBid(0).call();
        let ask = await exchange.methods.getAsk(0).call();
        // console.log(bid);
        // console.log(ask);
        assert(bid);
        assert(ask);
        //attempt to get an object back with indexes that are labelled e.g. owner, price, amount, timestamp
        //let bidsCount = await exchange.methods.getBidsCount().call();
        // let asksCount = await exchange.methods.getAsksCount().call();
        // const bid = await Promise.all(
        //     Array(parseInt(bidsCount)).fill().map((element, index) => {
        //         return exchange.methods.getBids(index).call();
        //     })
        // );

        // const ask = await Promise.all(
        //     Array(parseInt(asksCount)).fill().map((element, index) => {
        //         return exchange.methods.getAsks(index).call();
        //     })
        // );
    });

    it('can acquire the total amount of demand and supply off the exchange', async()=>{
        await agent.placeBuy(10,1000);
        await agent.placeBuy(9,1000);
        await agent.placeBuy(8,1000);
        await agent.placeAsk(11,1000);
        await agent.placeAsk(12,1000);
        await agent.placeAsk(13,1000);

        let bidsCount = await exchange.methods.getBidsCount().call();
        let asksCount = await exchange.methods.getAsksCount().call();

        let bids = new Array();
        let asks = new Array();
        
        for(i=0; i<bidsCount; i++){
            let bid = await exchange.methods.getBid(i).call();
            let ask = await exchange.methods.getAsk(i).call();
            bids[i] = parseInt(bid['2'], 10);
            asks[i] = parseInt(ask['2'], 10);
        }
     
        const sumBids = bids.reduce((a, b) => a + b, 0);
        const sumAsks = asks.reduce((a,b) => a + b, 0);
        assert(sumBids, bidsCount*1000);
        assert(sumAsks, asksCount*1000);
        
    });

    it('can set a summary of smartMeter details of the contract', async () =>{
        await agent.setSmartMeterDetails(1200, 1400);

        let demand = await agent.newHousehold.methods.currentDemand().call();
        let supply = await agent.newHousehold.methods.currentSupply().call();
        let excess = await agent.newHousehold.methods.excessEnergy().call();
        assert(demand, 1400);
        assert(supply, 1200);
        assert(excess, 200);
    });


});