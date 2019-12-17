const path = require('path');
const solc = require('solc');
const fs = require('fs-extra'); // gives access to file system with extra functions

const buildPath = path.resolve(__dirname, 'build'); //currentdirectoy __dirname; 
fs.removeSync(buildPath);

const householdPath = path.resolve(__dirname, 'contracts', 'ContractsDoubleAuctionNew.sol'); // get path to the contracts directory
const source = fs.readFileSync(householdPath, 'utf8');
const output = solc.compile(source, 1).contracts;

fs.ensureDirSync(buildPath); // if directory doesn't exist, create a new one

console.log(output);
//assign keys of the output to contract, this is Campaign and Campaign fatory 
for (let contract in output) {
    fs.outputJsonSync(
        path.resolve(buildPath, contract.replace(':', '') + '.json'),
        output[contract]
    );
}
