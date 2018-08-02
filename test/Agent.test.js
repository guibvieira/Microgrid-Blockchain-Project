//Using ganache
const assert = require('assert');
const ganache = require('ganache-cli');
// const Web3 = require('web3');
// const web3 = new Web3(ganache.provider());
const web3 = require('../ethereum/web3.js');
//probably same as web3 = new Web3( new Web3.providers.HttpProvider("http://localhost:7545"))
const Agent = require('../models/agent.js');
const readCSV = require('../Simulation/readFile.js');

//compiled contracts
const compiledHousehold = require('../ethereum/build/Household.json');
const factory = require('../ethereum/factory');
const exchange = require('../ethereum/exchange');

let household;
let agentAccount;
let agent;
let agentBalance;
let date;

beforeEach(async() => {
    accounts = await web3.eth.getAccounts();
 
    //create agent instance
    agent = new Agent(5000);

    agentAccount = await agent.getAccount(0);
    console.log('agent account', agent.ethereumAddress);
    agentBalance = await agent.getAgentBalance();
    //console.log(agent.balance);

    household = await agent.deployContract(5000);


});

describe('Agents', () => {

    it('deploy an instance of Agent and check if you can access ethereumAddress and deposited balance', async () =>{

        console.log('contract address', agent.householdAddress);
        
        let exchangeAddress= await agent.household.methods.exchangeAddress().call();
        let balance= await web3.eth.getBalance(agent.householdAddress);
        assert(exchangeAddress, exchange.options.address );
        assert(web3.utils.fromWei('2', 'ether'), balance);
        
    });

    it('can charge and discharge an existing Contract of Agent', async () =>{
        let preChargeAmount = await agent.household.methods.amountOfCharge().call();

        await agent.chargeContract(1000);

        let postChargeAmount =  await agent.household.methods.amountOfCharge().call();
        await agent.dischargeContract(2000);
        let postDischargeAmount = await agent.household.methods.amountOfCharge().call();

        assert(postChargeAmount-1000, preChargeAmount);
        assert(postDischargeAmount+2000, postChargeAmount);
    });

    it('can place a Buy and a Sell', async() =>{
        date = (new Date()).getTime();
        await agent.placeBuy(10,1000, date);
        await agent.placeAsk(11,1000, date);

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
        date = (new Date()).getTime();
        await agent.placeBuy(10,1000, date);
        await agent.placeBuy(9,1000,date);
        await agent.placeBuy(8,1000,date);
        await agent.placeAsk(11,1000, date);
        await agent.placeAsk(12,1000, date);
        await agent.placeAsk(13,1000, date);

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

        let demand = await agent.household.methods.currentDemand().call();
        let supply = await agent.household.methods.currentSupply().call();
        let excess = await agent.household.methods.excessEnergy().call();
        assert(demand, 1400);
        assert(supply, 1200);
        assert(excess, 200);
    });

    it('can deploy and pass historical data to each agent', async () =>{
        let householdHistoricData = new Array();
        let householdHistoricData2 = new Array();
        let inputFile = 'data/metadata-LCOE.csv';
        let id = new Array();
        let baseValue = new Array();
        let baseValueBattery = new Array();
        let householdFiles = new Array();
        let agentsNoBattery = new Array();
        let agentsBattery = new Array();


    async function loadData(inputFile){
        let resultSet = await readCSV(inputFile);
        return resultSet;
    }

    async function createAgents(metaData, householdHistoricData){
        //console.log('this is meta data: ', metaData[0]);
        
        for (i=0; i<23; i++){
                console.log(i);            
        
                //creation of agents and feeding the data in
                agent = new Agent(0); //no battery capacity passed
                agentAccount = await agent.getAccount(i);
                //console.log('agents account', agentAccount);
                household = await agent.deployContract();
                //console.log('household contract', household);
                console.log('this is household data:', householdHistoricData[0]);
                await agent.loadSmartMeterData(householdHistoricData[i], baseValue[i], baseValueBattery[i]);
                agentsNoBattery.push( new Array(id, agent));
        }
    
        //create half of the households with battery Capacity
        for (i=23; i<46; i++){
                //creation of agents and feeding the data in
            agent = new Agent(12000); //tesla powerwall
            agentAccount = await agent.getAccount(i);
            household = await agent.deployContract();
            await agent.loadSmartMeterData(householdHistoricData[i], baseValue[i], baseValueBattery[i]);
            agentsBattery.push(new Array(id, agent));
           
        }
        return { agentsBattery, agentsNoBattery };
    }

    async function getFiles() {
        const metaData= await loadData(inputFile);

        for (i=1; i<metaData.length/2; i++){
                console.log(i);
                id.push( metaData[i][0] );
                baseValue.push( metaData[i][2] );
                baseValueBattery.push( metaData[i][3] );
                householdFiles.push(`data/household_${id[i-1]}.csv`);
        }
    
        for (const file of householdFiles){
            householdHistoricData.push( await loadData(file));
        }
        //console.log(results);
       return { householdHistoricData, metaData};
    }
    fileResults = await getFiles();
    metaData = fileResults.metaData;
    householdHistoricData = fileResults.householdHistoricData;
    
    results = await createAgents(metaData, householdHistoricData);
    console.log(results.agentsBattery);
    
    //metaData= await loadData(inputFile);
    //console.log(metaData.length/2);
    //console.log('logging results household 26', metaData);
    //create half the households without any battery Capacity
    // for (i=1; i<23; i++){
    //     console.log(i);
    //     // id = metaData[i][0];
    //     // baseValue = metaData[i][2];
    //     // baseValueBattery = metaData[i][3];
    //     // householdFile = `./data/household_${id}.csv`;
        
    //    // householdHistoricData = await loadData(householdFile);

    //     //creation of agents and feeding the data in
    //     agent = new Agent(0); //no battery capacity passed
    //     agentAccount = await agent.getAccount(i);
    //     household = await agent.deployContract();
    //     //await agent.loadSmartMeterData(householdHistoricData, baseValue, baseValueBattery);
    //     agentsNoBattery.push( new Array(agent));
    // }
    
    //create half of the households with battery Capacity
    // for (i=metaData.length/2; i<metaData.length; i++){
    //     id = metaData[i][0];
    //     baseValue = metaData[i][2];
    //     baseValueBattery = metaData[i][3];
    //     householdFile = `./data/household_${id}.csv`;
        
    //     householdVar = await loadData(householdFile);

    //     //creation of agents and feeding the data in
    //     agent = new Agent(12000); //tesla powerwall
    //     agentAccount = await agent.getAccount(i);
    //     household = await agent.deployContract();
    //     await agent.loadSmartMeterData(householdHistoricData, baseValue, baseValueBattery);
    //     agentsBattery.push(new Array(id, agent));

    // }
    });


});