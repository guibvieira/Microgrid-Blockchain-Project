pragma solidity ^0.4.17;

contract BatteryFactory{
    address[] public deployedBatteries;
    mapping (address => uint) public balances;
    address public owner;
    
    constructor() public{
        owner = address(this);
    }
    
    function createBattery(uint capacity ) public{
        address newBattery = new Battery(capacity, msg.sender, owner);
        deployedBatteries.push(newBattery);
    }
    
    function getDeployedBatteries() public view returns (address[]) {
        return deployedBatteries;
    }
    
    function addBalance(address target,uint price) public {
        balances[target] += price;
    }
    
    function subBalance(address target,uint price) public {
        balances[target] -= price;
    }
    
    
    
}

contract Battery{
    address public owner;
    address public parent;
    uint public batteryCapacity;
    uint public amountOfCharge;
    
    
    constructor(uint capacity, address creator, address watch_address) public {
        owner = creator;
        batteryCapacity = capacity;
        parent = watch_address;
    }
    
    function charge(uint amount) public {
        require(msg.sender == owner);
        amountOfCharge += amount;
    }
    
    function discharge(uint amount) public {
        require(msg.sender == owner);
        amountOfCharge -= amount;
    }
    
    function buyEnergy(uint amount, address recipient, uint price ) public payable returns(bool successful){
        if (address(this).balance < price) return false;
        
        amountOfCharge += amount;
        BatteryFactory factory = BatteryFactory(parent);
        
        factory.subBalance(address(this), price);
        factory.addBalance(recipient, price);
        recipient.transfer(price);
    }
    
    function sellEnergy(uint amount, address recipient, uint price ) public {
        
        if(amountOfCharge>amount){
            amountOfCharge = amountOfCharge - amount;
        }
        
        BatteryFactory factory = BatteryFactory(parent);
        factory.subBalance(recipient, price);
        factory.addBalance(address(this), price);
        recipient.transfer(price);
    }
    
}