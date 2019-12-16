const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
//const web3 = new Web3(ganache.provider());
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))
//const web3 = require('../ethereum/web3-ganache.js');

const Agent = require('../models/agentDoubleAuction.js');

const compiledFactory = require('../ethereum/build/HouseholdFactory.json');
const compiledCampaign = require('../ethereum/build/Household.json');
const compiledExchange = require('../ethereum/build/Exchange.json');

//compiled contracts
const initHouseholdFactory = require('../ethereum/factory');
const initExchange = require('../ethereum/exchange');

let accounts;
let factory;
let householdAddress;
let household;
let household1;
let household2;
let household3;
let household4;
let exchange;
let date;
let agent1;
let agent2;
let agent3;
let agent4;
let agent5;
let agents = [];

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    factory = await initHouseholdFactory();
    exchange = await initExchange();



    for (let i = 0; i < 10; i++) {
        let newAgent = new Agent(12000, true);
        let newAccount = await newAgent.getAccount(i);
        let newContract = await newAgent.deployContract(factory, exchange);
        // let newBalanc = await newAgent.getAgentBalance();
        let agent = {
            agent: newAgent,
            account: newAccount,
            contract: newContract,
            transactions: []
        }
        agents.push(agent);
    }

});

describe('Households', () => {


    it('can submit a Bid and an Ask to exchange from Household Contract', async () => {
        date = (new Date()).getTime();

        for (let i = 0; i < 5; i++) {
            agents[i].transactions.push(await agents[i].agent.placeBuy(10, 1000, date));

        }
        for (let i = 5; i < 10; i++) {
            agents[i].transactions.push(await agents[i].agent.placeAsk(10, 1000, date));

        }
        // agents.forEach((agent, ind) => {
        //     if (ind < 3) {
        //         agent.agent.placeBuy(10, 1000, date);
        //     }
        //     else {
        //         agent.agent.placeAsk(10, 1000, date);
        //     }

        // })
        bids = await exchange.methods.Bids(0).call();

        bidsCount = await exchange.methods.getBidsCount().call();
        asksCount = await exchange.methods.getAsksCount().call();

        console.log('bids count ', bidsCount);
        console.log('asks count', asksCount);

        assert(bids.amount, 1000);
        assert(bids.price, 10);
        assert(bidsCount, 1);

        // await household1.methods.submitBid(9, 1000, date).send({
        //     from: accounts[0],
        //     gas: '1999999'
        // });


        // await household2.methods.submitBid(10, 1000, date).send({
        //     from: accounts[0],
        //     gas: '1999999'
        // });

        // date = (new Date()).getTime();

        // await household2.methods.submitBid(10, 1000, date).send({
        //     from: accounts[0],
        //     gas: '1999999'
        // });

        //submit asks
        // await household3.methods.submitAsk(12, 1000, date).send({
        //     from: accounts[1],
        //     gas: '1999999'
        // });

        // await household4.methods.submitAsk(14, 1000, date).send({
        //     from: accounts[1],
        //     gas: '1999999'
        // });

        // await household4.methods.submitAsk(10, 1000, date).send({
        //     from: accounts[1],
        //     gas: '1999999'
        // });

        // // await household4.methods.submitAsk(16, 1000, date).send({
        // //     from: accounts[1],
        // //     gas: '1999999'
        // // });

        // bids = await exchange.methods.Bids(0).call();
        // bidsCount = await exchange.methods.getBidsCount().call();
        // asksCount = await exchange.methods.getAsksCount().call();
        // console.log('bids count ', bidsCount);
        // console.log('asks count', asksCount);
        // // assert(bids.amount, 1000);
        // // assert(bids.price, 10);
        // // assert(bidsCount, 4);
        // assert(true);
    });


})