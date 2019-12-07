const ganache = require('ganache-cli');
const Web3 = require('web3');
web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))
const Agent = require('../models/agentDoubleAuction.js');
const AgentNationalGrid = require('../models/agentNationalGrid.js');
const AgentBiomass = require('../models/agentBiomassDAuction.js');
const plotly = require('plotly')('guibvieiraProject', 'Whl2UptBOq1gMvQrRGHk');

//compiled contracts
const factory = require('../ethereum/factory');
const exchange = require('../ethereum/exchange');
const compiledHousehold = require('../ethereum/build/Household.json');

//packages and functions imports
const readCSV = require('./readFile.js');
const { convertArrayGasToPounds, convertArrayWeiToPounds, convertWeiToPounds, convertGasToPounds } = require('./conversions.js');
let fs = require('fs');
var csv = require("fast-csv");
let inputFile = './data/metadata-LCOE.csv';
let id = [];
let baseValue = [];
let baseValueBattery = [];

let agentsBattery = [];

async function init() {
    let amountSuccessFulBids = [];
    let aggregatedDemand = [];
    let aggregatedSupply = [];
    let historicalPricesPlot = [];
    let biomassAgentBalanceHistory = [];
    let biomassContractBalanceHistory = [];
    let nationalGridBalanceHistory = [];
    let bidCount = [];
    let askCount = [];

    let successfulBids = [];
    let successfulAsks = [];
    let amountSuccessfulAsks = [];
    let succesfulBidsPrice = [];
    let succesfulBidsQuantity = [];
    let succesfulBidsTransactionAmount = [];

    let biomassSuccesfulBidsPrice = [];
    let biomassSuccesfulBidsTransactionAmount = [];

    var accounts = await web3.eth.getAccounts();

    let { metaData, householdHistoricData } = await getFiles();

    let biomassData = generateBiomassData(householdHistoricData);

    let metaDataBattery = metaData.slice(0, Math.floor(metaData.length / 4));

    let householdDataBattery = householdHistoricData.slice(0, Math.floor(householdHistoricData.length) / 4);

    let { agents, agentNationalGrid, agentBiomass } = await createAgents(metaDataBattery, householdDataBattery, biomassData, 12000, true, BIOMASS_PRICE_MIN, BIOMASS_PRICE_MAX);