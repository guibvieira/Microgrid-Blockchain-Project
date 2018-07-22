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
        // alternatively (new Household).value(1000000)(capacity, msg.sender, owner)
        // to send ether with creation
        //balances[newHousehold] = 1;
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
        uint date;
    }
    
    Bid[] public Bids;
    Bid[] public Asks;
    address public owner;
    address public contractAddress;
    address public factoryAddress;
    address public exchangeAddress;
    uint public balanceContract;
    Exchange ex;
    Household hh;
    
    
    constructor(uint capacity, address creator, address watch_address) public payable{
        owner = creator;
        batteryCapacity = capacity;
        amountOfCharge = capacity;
        factoryAddress = watch_address;
        contractAddress = address(this);
    }
    
    function deposit() public payable {
    }

    function () public payable {}

    function setSmartMeterDetails(uint _demand, uint _supply, uint _excessEnergy) public {
        demand = _demand;
        supply = _supply;
        excessEnergy = _excessEnergy;
    }
    
    function getBids(uint index) public view returns(address, uint, uint, uint){
        return (Bids[index].origin,
                Bids[index].price,
                Bids[index].amount,
                Bids[index].date
        );
    }

    function getAsks(uint index) public view returns(address, uint, uint, uint){
        return (Asks[index].origin,
                Asks[index].price,
                Asks[index].amount,
                Asks[index].date
        );
    }

    function setExchange(address exchange) public {
        exchangeAddress = exchange;
    }
    
    function charge(uint amount) public restricted{
        amountOfCharge += amount;
    }
    
    function discharge(uint amount) public {
        amountOfCharge -= amount;
    }
    
    function submitBid(uint price, uint amount) public restricted {
        Bid memory newBid = Bid({
            origin: contractAddress,
            price: price,
            amount: amount,
            date: now
        });
        
        Bids.push(newBid);
        ex = Exchange(exchangeAddress);
        ex.placeBid(price, amount);
    }
    
    function submitAsk(uint price, uint amount) public restricted {
        Bid memory newAsk = Bid({
            origin: contractAddress,
            price: price,
            amount: amount,
            date: now
        });
        
        Asks.push(newAsk);
        ex = Exchange(exchangeAddress);
        ex.placeAsk(price, amount);
    }

    function buyEnergy(uint _amount, address _recipient, uint _price ) external payable returns(bool successful){
                
        amountOfCharge += _amount;

        hh = Household(_recipient);
        hh.discharge(_amount);

        uint finalPrice = (_amount/1000)*_price;

        _recipient.call.value(finalPrice).gas(20317)();

        // HouseholdFactory factory = HouseholdFactory(factoryAddress);
        
        // factory.subBalance(address(this), price);
        // factory.addBalance(recipient, price);
        
        return true;
    }

    modifier restricted() {
        require(msg.sender == owner);
        _;
    }
    
}

contract Exchange {

    struct Bid {
        address owner;
        uint price;
        uint amount;
        uint date;
    }

    struct Ask {
        address owner;
        uint price;
        uint amount;
        uint date;
    }

    Bid[] public Bids;
    Ask[] public Asks;
    Household hh;
    
    function deposit() public payable {
    }

    function () public payable{}

    function getBid(uint index) public returns(address, uint, uint, uint){
        return (Bids[index].owner, Bids[index].price, Bids[index].amount, Bids[index].date);
    }

    function getAsk(uint index) public  returns(address, uint, uint, uint){
        return (Asks[index].owner, Asks[index].price, Asks[index].amount, Asks[index].date);
    }
    

    function placeBid(uint _price, uint _amount) external returns (bool) {
        Bid memory b;
        b.owner = msg.sender;
        b.price = _price;
        b.amount = _amount;
        b.date = now;

        for(uint i = 0; i < Bids.length; i++) {
            if(Bids[i].price > _price) {
                Bid[] memory tempBids = new Bid[](Bids.length - i);
                for(uint j = i; j < Bids.length; j++) {
                    tempBids[j-i] = Bids[j];
                }
                Bids[i] = b;
                Bids.length = Bids.length + 1;
                for(uint k = 0; k < tempBids.length; k++) {
                    Bids[i+k+1] = tempBids[k];
                }
                
                if(Asks.length>0){
                    matchBid(Bids.length-1 ,Asks.length-1 );
                }
                return true;
            }
        }

        Bids.push(b);
        if(Asks.length>0){
            
            matchBid(Bids.length-1 ,Asks.length-1 );
            
        }
        return true;
    }

    function placeAsk(uint _price, uint _amount) external returns (bool) {
        Ask memory a;
        a.owner = msg.sender;
        a.price = _price;
        a.amount = _amount;
        a.date = now;


        for (uint i = 0; i < Asks.length; i ++) {
            if(Asks[i].price < _price) {
                Ask[] memory tempAsks = new Ask[](Asks.length - i);
                for (uint j = i; j < Asks.length; j++) {
                    tempAsks[j-i] = Asks[j];
                }
                Asks[i] = a;
                Asks.length = Asks.length + 1;
                for (uint k = 0; k < tempAsks.length; k++) {
                    Asks[i+k+1] = tempAsks[k];
                }
              
                if (Bids.length>0){
                    matchBid(Bids.length-1,Asks.length-1 );
                }
                return true;
            }
        }
        Asks.push(a);
        if(Bids.length > 0) {
            matchBid(Bids.length-1,Asks.length-1 );
        }
        return true;
    }

    function matchBid(uint bid_index, uint ask_index) public returns (bool) {
        if (Bids[bid_index].price < Asks[ask_index].price) {
            return true;
        }
        
        hh = Household(Bids[bid_index].owner);
        //uint remainder = Bids[bid_index].amount - Asks[ask_index].amount;
        uint price = (Asks[ask_index].price + Bids[bid_index].price) / 2;
        if(int(Bids[bid_index].amount - Asks[ask_index].amount) >= 0){
            uint remainder = Bids[bid_index].amount - Asks[ask_index].amount;
            uint calcAmount = Bids[bid_index].amount - remainder;
            
            hh.buyEnergy(calcAmount, Asks[ask_index].owner, price);
            
            Bids[bid_index].amount = remainder;
            Asks[ask_index].amount = 0;
            
            cleanAskLedger();
            return true;
        }
        
        if(int(Bids[bid_index].amount - Asks[ask_index].amount) < 0){
            remainder = Asks[ask_index].amount - Bids[bid_index].amount;
            calcAmount = Asks[ask_index].amount - remainder;
            
            hh.buyEnergy(calcAmount, Asks[ask_index].owner, price);
            
            Bids[bid_index].amount = 0;
            Asks[ask_index].amount = remainder;
            
            cleanBidLedger();
            return true;
        }
    }

    function cleanAskLedger() public returns (bool) {
        for(uint i = Asks.length - 1; i >= 0; i--) {
            if (Asks[i].amount == 0) {
                delete Asks[i];
            }
        }
        return true;
    }

    function cleanBidLedger() public returns (bool) {
        for(uint i = Bids.length -1; i >= 0; i--) {
            if(Bids[i].amount > 0) {
                delete Bids[i];
            }
        }
        return true;
    }

    function getBidsCount() public view returns(uint) {
        return Bids.length;
    }
    
    function getAsksCount() public view returns(uint) {
        return Asks.length;
    }
}