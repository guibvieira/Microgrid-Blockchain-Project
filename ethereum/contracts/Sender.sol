pragma solidity ^0.4.17;
contract DecisionMaker{
    Sender sd;
    
    constructor() payable public{}

    function someLogicToDecidePayment(address receiver, address sender) public {
        //Some logic then:
        sd = Sender(msg.sender);
        sd.send(receiver, 1000);
    }
    
}
contract Sender {
    DecisionMaker dm;
    
    constructor() payable {
    }

    function deposit() payable{}
    
  function send(address _receiver, uint _amount) payable public {
    _receiver.call.value(_amount).gas(20317)();
  }
  
  function send_transfer(address _receiver, uint _amount) payable public {
      _receiver.transfer(_amount);
  }
  function placeBuy(address receiver, address decisionMaker) public {
      dm = DecisionMaker(decisionMaker);
      dm.someLogicToDecidePayment(receiver, address(this));
  }
  

}
contract Receiver {
  uint public balance = 0;
  
  constructor() payable public{}
  
  function () payable public{
    balance += msg.value;
  }
}