# Microgrid-Blockchain-Project

This project was undertaken for my dissertation during my MSc of Artificial Intelligence. This work will investigate the use of
peer-to-peer energy market platform to be used within microgrids as a contingency to solve these problems. The rise of prosumers, both consumers and producers, has been caused by the increasing affordability to invest in
domestic solar systems. Hence, consumers and prosumers can trade within their communities to better manage their demand and supply as well as providing socio-economic benefts. The use of blockchain technologies is
implemented to develop a energy trading market platform while following a micromarket setup based on the Brooklyn Microgrid project use case. The Ethereum blockchain technology is used and a cost analysis comparing
to the current energy system to the blockchain micromarket setup is presented. The continuous double auction and uniform-price double sided auction mechanisms are implemented with two different architectures. A simulation
of these are experimented on the micromarket setup and differences are discussed. It is observed that the continuous double auction yields a more favourable mechanism to be implemented within the smart contract
limitations of the blockchain, and offers a cheaper solution than using the current energy systems. Finally, it is concluded that blockchain technologies are an eligible technology to be used within the microgrid energy
markets, as they provide a decentralised, trustless and secure information system, that fits the requirements for smart-grid integration.

If interested, read the dissertation file in the repository.

--------------- Application ---------------

Pre-requisites for simulation:

- Node.js - Needs Node.js 10 to run
- NPM (Node package manager)

Pre-requisites for react App use:

- Node.js
- NPM (Node package manager)
- Metamask

Instructions for Metamask:
Metamask provides you with a UI and a provider on the browser to perform basic operations on the Ethereum main and test networks.

- Create an account and keep mnemonic
- Request some Ether from an Ethereum Faucet : - https://faucet.metamask.io/ - https://faucet.ropsten.be/
- Once you have ether in one of your metamask accounts, you're good to go and start experimenting with the application !

######################################################################
Instructions to setup the application

1. Open the microgrid project using a code editor (e.g. visual studio code)

2. run the command 'npm install' in the root directory - this will install all the necessary dependencies

3. Depending on your desired use:

- Experiment with online Application => run 'npm run prepareApp' - this will compile and deploy your contracts into the ethereums test network - then run 'npm run dev' which will output the localhost link. Use this link in the browser in which Metamask extension is installed and running

- Experiment with uniform-price double sided auction simulation 1. run the command 'ganache-cli -a <number of accounts to create> -e <number of desired ethereum per account> 2. run the command 'npm run prepareUP' (this will compile and deploy respective smart contracts) 3. Copy the exchange and factory contract addresses and paste them to their respective fields in exchange.js and factory.js in the ethereum folder 4. go into simulation/simulationUP.js and customise the desired parameters for the simulation (constants) 5. run the command 'npm run simUP' 6. Analyse the csv file outputed using analyseData.py in a python IDE or powershell (need to install dependencies yourself in that case)

* Experiment with continuous double auction simulation 1. run the command 'ganache-cli -a <number of accounts to create> -e <number of desired ethereum per account> --gaslimit <Using 8,000,000> 2. run the command 'npm run prepareDA' (this will compile and deploy respective smart contracts) 3. Copy the exchange and factory contract addresses and paste them to their respective fields in exchange.js and factory.js in the ethereum folder 4. go into simulation/simulationDoubleAuction.js and customise the desired parameters for the simulation (constants) 5. run the command 'npm run simDA' 6. Analyse the csv file outputed using analyseData.py in a python IDE or powershell (need to install dependencies yourself in that case)
