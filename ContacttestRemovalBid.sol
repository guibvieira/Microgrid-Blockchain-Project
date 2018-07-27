contract test{
    
    uint[] public array = [1,2,3,4,5];
    
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
    
    function placeBid(uint _price, uint _amount) public returns (bool) {
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
        if(Asks.length > 0) {
            matchBid(Bids.length-1,Asks.length-1 );
        }
        return true;
    }
    function placeAsk(uint _price, uint _amount) public returns (bool) {
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

        
        uint price = (Asks[ask_index].price + Bids[bid_index].price) / 2;

        if(int(Bids[bid_index].amount - Asks[ask_index].amount) >= 0){
            uint remainder = Bids[bid_index].amount - Asks[ask_index].amount;
            uint calcAmount = Bids[bid_index].amount - remainder;
            
            
            Bids[bid_index].amount = remainder;
            if(remainder==0){
                removeBid(bid_index);
            }
            removeAsk(ask_index);
            
            return true;
        }
        
        if(int(Bids[bid_index].amount - Asks[ask_index].amount) < 0){
            remainder = Asks[ask_index].amount - Bids[bid_index].amount;
            calcAmount = Asks[ask_index].amount - remainder;
            
            
            Asks[ask_index].amount = remainder;
            if(remainder == 0){
                removeAsk(ask_index);
            }
            removeBid(bid_index);
            
            return true;
        }
    }
    
    function removeBid(uint index) public {
        if (index >= Bids.length) return;

        for (uint i = index; i<Bids.length-1; i++){
            Bids[i] = Bids[i+1];
        }
        Bids.length--;
    }
     function removeAsk(uint index) public {
        if (index >= Asks.length) return;
        
        for (uint i = index; i<Asks.length-1; i++){
            Asks[i] = Asks[i+1];
        }
        Asks.length--;
    }
}