pragma solidity ^0.4.17;

contract HouseholdFactory{
    address[] public deployedHouseholds;
    mapping (address => uint) public balances;
    address public owner;
    
    constructor() public{
        owner = address(this);
    }
    
    function createHousehold(uint capacity ) public{
        address newHousehold = new Household(capacity, msg.sender, owner);
        deployedHouseholds.push(newHousehold);
    }
    
    function getDeployedHouseholds() public view returns (address[]) {
        return deployedHouseholds;
    }
    
    function addBalance(address target,uint price) public {
        balances[target] += price;
    }
    
    function subBalance(address target,uint price) public {
        balances[target] -= price;
    }
}

contract Household{
    
    uint public demand;
    uint public supply;
    uint public batteryCapacity;
    uint public amountOfCharge;
    uint public excessEnergy;
    
    
    struct Bid{
        address origin;
        uint price;
        uint amount;
    }
    address public owner;
    address public parent;
    
    constructor(uint capacity, address creator, address watch_address) public {
        owner = creator;
        batteryCapacity = capacity;
        parent = watch_address;
    }
    function charge(uint amount) public {
        require(msg.sender == owner);
        amountOfCharge+= amount;
    }
    
    function discharge(uint amount) public {
        require(msg.sender == owner);
        amountOfCharge -= amount;
    }
    
    function buyEnergy(uint amount, address recipient, uint price ) public payable returns(bool successful){
        if (address(this).balance < price) return false;
        
        amountOfCharge += amount;
        HouseholdFactory factory = HouseholdFactory(parent);
        
        factory.subBalance(address(this), price);
        factory.addBalance(recipient, price);
        recipient.transfer(price);
    }
    
    function sellEnergy(uint amount, address recipient, uint price ) public {
        
        if(amountOfCharge>amount){
            amountOfCharge -= amount;
        }
        
        HouseholdFactory factory = HouseholdFactory(parent);
        factory.subBalance(recipient, price);
        factory.addBalance(address(this), price);
        recipient.transfer(price);
    }
    
}