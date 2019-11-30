README

Pre-requesites for simulation:
- Node.js
- NPM (Node package manager)

Pre-requesites for online App use:
- Node.js
- NPM (Node package manager)
- Metamask

Instructions for Metamask:
Metamask provides you with a UI and a provider on the browser to perform basic operations on the Ethereum main and test networks.
- Create an account and keep mnemonic
- Request some Ether from an Ethereum Faucet :
	- https://faucet.metamask.io/
	- https://faucet.ropsten.be/
- Once you have ether in one of your metamask accounts, you're good to go and start experimenting with the application !

######################################################################
Instructions to setup the application

1. Open the microgrid project using a code editor (e.g. visual studio code)

2. run the command 'npm install' in the root directory - this will install all the necessary dependencies

3. Depending on your desired use: 
- Experiment with online Application => run 'npm run prepareApp'
	- this will compile and deploy your contracts into the ethereums test network
	- Copy the exchange and factory contract addresses and paste them to their respective fields in exchangeApp.js and factoryApp.js in the ethereum folder
	- then run 'npm run dev' which will output the localhost link. Use this link in the browser in which Metamask extension is installed and running

- Experiment with uniform-price double sided auction simulation
	1. run the command 'ganache-cli -a <number of accounts to create> -e <number of desired ethereum per account> 
	2. run the command 'npm run prepareUP' (this will compile and deploy respective smart contracts)
	3. Copy the exchange and factory contract addresses and paste them to their respective fields in exchange.js and factory.js in the ethereum folder
	4. go into simulation/simulationUP.js and customise the desired parameters for the simulation (constants)
	5. run the command 'npm run simUP'
	6. Analyse the csv file outputed using analyseData.py in a python IDE or powershell (need to install dependencies yourself in that case)
	

- Experiment with continuous double auction simulation
	1. run the command 'ganache-cli -a <number of accounts to create> -e <number of desired ethereum per account> 
	2. run the command 'npm run prepareDA' (this will compile and deploy respective smart contracts)
	3. Copy the exchange and factory contract addresses and paste them to their respective fields in exchange.js and factory.js in the ethereum folder
	4. go into simulation/simulationDA.js and customise the desired parameters for the simulation (constants)
	5. run the command 'npm run simDA'
	6. Analyse the csv file outputed using analyseData.py in a python IDE or powershell (need to install dependencies yourself in that case)
	