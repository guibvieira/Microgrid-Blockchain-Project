const inquirer = require('inquirer');
const fs = require('fs');
var cmd = require('node-cmd');
var csv = require("fast-csv");

inquirer
    .prompt([
        {
            type: 'list',
            name: 'typeOfAuction',
            message: "What type of auction would you like to run?",
            choices: [
                'Uniform Price',
                'Continuous Double Auction',
                new inquirer.Separator()
            ]
        },
        {
            type: 'input',
            name: 'lengthSimulation',
            message: 'How many days would you like it to run for? (give a number)'
        }
    ])
    .then(answers => {
        console.log(JSON.stringify(answers, null, '  '));
        let csvData = [{
            typeOfAuction: answers["typeOfAuction"],
            lengthSimulation: answers["lengthSimulation"]
        }]

        const ws = fs.createWriteStream('userConfig.csv');
        csv
            .write(csvData, { headers: true })
            .pipe(ws);

        // if (answers["typeOfAuction"] === "Continuous Double Auction") {
        //     console.log('launching double auction simulation');
        //     // cmd.run('npm run prepareDA')

        // }
        // if (answers["typeOfAuction"] === "Uniform Price") {
        //     cmd.run("npm run prepareRunSimDA");
        // }
    });