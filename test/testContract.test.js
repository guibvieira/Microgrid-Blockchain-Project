const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const compiledDecision = require('../ethereum/build/DecisionMaker.json');
const compiledReceiver = require('../ethereum/build/Receiver.json');
const compiledSender = require('../ethereum/build/Sender.json');

let accounts;
let decision;
let sender;
let receiver;
let confirmation;
let post_balance;


beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    decision = await new web3.eth.Contract(JSON.parse(compiledDecision.interface))
        .deploy({ data: compiledDecision.bytecode })
        .send({ from: accounts[0], gas: '1999999' });

    receiver = await new web3.eth.Contract(JSON.parse(compiledReceiver.interface))
        .deploy({ data: compiledReceiver.bytecode })
        .send({ from: accounts[0], gas: '1999999' });

    sender = await new web3.eth.Contract(JSON.parse(compiledSender.interface))
        .deploy({ data: compiledSender.bytecode })
        .send({ from: accounts[0], gas: '1999999' });

});

describe('Testing Contracts', () => {
    it('Attempts to make a transaction from sender to receiver through DecisionMaker', async () =>{
        let pre_balance = await receiver.methods.balance().call();

        await sender.methods.deposit().send({
            from: accounts[0],
            gas: 1000000,
            value: 1000000
        });

        let senderBalance = await web3.eth.getBalance(sender.options.address);
        console.log('senders contract balance', senderBalance);
        console.log('pre balance of receiver (variable)', pre_balance);
        
        try{
        let confirmation= await sender.methods.placeBuy(receiver.options.address, decision.options.address).send({
            from: accounts[0],
            gas: 1999999
        })
        post_balance = await receiver.methods.balance().call();
        }catch(err){
        console.log(err);
    }

    let balanceOfAddress = await web3.eth.getBalance(receiver.options.address);
    senderBalance = await web3.eth.getBalance(sender.options.address);
    console.log('confirmation of transaction', confirmation);
    console.log('post balance of receiver (variable)', post_balance);
    console.log('balance of receiver contract address', balanceOfAddress);
    console.log('senders balance post transaction', senderBalance);

    console.log('finished test');
    });
});
