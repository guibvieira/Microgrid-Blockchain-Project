//Using ganache
const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3( new Web3.providers.HttpProvider("http://localhost:7545"))
const Agent = require('../models/agentSingle-Bid.js');
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
let accounts;

beforeEach(async() => {
    accounts = await web3.eth.getAccounts();
 
    //create agent instance
    agent = new Agent(5000);

    agentAccount = await agent.getAccount(0);
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
            
        
    });

    it('can charge and discharge an existing Contract of Agent', async () =>{
        let preDischargeAmount = await agent.household.methods.amountOfCharge().call();
        await agent.dischargeContract(1000);
        let postDischargeAmount = await agent.household.methods.amountOfCharge().call();
        await agent.chargeContract(1000);

        let postChargeAmount =  await agent.household.methods.amountOfCharge().call();
        

        assert(preDischargeAmount-1000, postDischargeAmount);
        assert(postDischargeAmount+1000, postChargeAmount);
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

        let bids = [];
        let asks = [];
        
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
        let householdHistoricData = [];
        let metaData = [];
        let inputFile = 'data/metadata-LCOE.csv';
        let id = [];
        let baseValue = [];
        let baseValueBattery = [];
        let householdFiles = [];


    async function loadData(inputFile){
        let resultSet = await readCSV(inputFile);
        return resultSet;
    }

    async function createAgents(metaData, householdHistoricData, batteryCapacity, batteryBool){
        
        for (i=0; i<metaData.length/2; i++){
                console.log(i);            
        
                //creation of agents and feeding the data in
                agent = new Agent(batteryCapacity, batteryBool); //no battery capacity passed
                agentAccount = await agent.getAccount(i);
                //console.log('agents account', agentAccount);
                household = await agent.deployContract();
                //console.log('household contract', household);
                const awaitResults = await agent.loadSmartMeterData(householdHistoricData[i], baseValue[i], baseValueBattery[i], id [i]);
                let newAgent = {
                    id: id [i],
                    agent,
                    agentAccount
                }
                agents.push(newAgent);
        }   

        return agents;
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
        const responses = await Promise.all(householdHistoricData);
        return { metaData, householdHistoricData};
    }
    let { metaDataFinal, householdHistoricDataFinal} = await getFiles();
    
    //let metaDataBattery = metaData.slice(0, Math.floor(metaData.length/2));
    let metaDataNoBattery = metaData.slice( Math.floor(metaDataFinal.length)/2 , metaDataFinal.length-1 );

    //let householdDataBattery = householdHistoricData.slice(0, Math.floor(householdHistoricData.length)/2 );
    let householdDataNoBattery = householdHistoricDataFinal.slice(Math.floor(householdHistoricDataFinal.length)/2, householdHistoricDataFinal.length-1);

    //let agentsBattery = await createAgents(metaDataBattery, householdDataBattery, 12000, true);
    let agentsNoBattery =  await createAgents(metaDataNoBattery, householdDataNoBattery, 0, false);
    
    let simDuration = householdHistoricDataFinal[0].length;    //start simulation
    let timeArray= [];
    
    for (i= 0; i < simDuration; i++){
        timeArray.push(i);
        console.log('time', i);
        

        for (j = 0; j < agentsNoBattery.length/4; j++){

            agentsNoBattery[j].agent.setCurrentTime(i);
            agentsNoBattery[j].agent.purchaseLogic();

        }

        let { bids, asks } = await getExchangeBids();
        if (bids.length > 0  || asks.length  > 0 ){        
            let intersection = calculateIntersection(bids, asks);
            console.log('intersection', intersection); //returns two values, first is the amount it intersects at , second the price
            //populate every agent with the closing price for this time step
            for (j = 0; j < agentsNoBattery.length/4; j++){

                agentsNoBattery[j].agent.historicalPrices[i] = intersection[1];
    
            }
        }
    }
    });


});