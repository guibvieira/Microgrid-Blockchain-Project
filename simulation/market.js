class Market {
    constructor(){
        getDate();
        getCurrentTime();
    }

    var demand = new Array();
    var supply = new Array();
    var currentDate = new Date();
    var currentTime = new Date();

    var buyBids = new Array();
    var sellBids = new Array();

    checkMatches(){
        for (i = 0; i <buyBids.length; i++) {

        }
        if(buyBids[])
    }

    placeBuy(origin, price, amount){
        this.buyBids.push(new Bid(origin, price, amount));
        // Implementation
        var sortedArray = this.buyBids.sort(sortByProperty(args));
    }

    placeSell(origin, price, amount){
        this.sellBids.push(new Bid(origin, price, amount));
    }

    sortBuyBids(){

    }

    sortByPropertyBuyer(property) {
        return function (a, b) {
            var sortStatus = 0,
                aProp = a[property],
                bProp = b[property];
            if (aProp < bProp) {
                sortStatus = 1;
            } else if (aProp > bProp) {
                sortStatus = -1;
            }
            return sortStatus;
        };
    }


    getDate(){
        day = currentDate.getDate();
        month = currentDate.getMonth() + 1;
        year = currentDate.getFullYear();
        this.currentDate = day + "/" + month + "/" + year;
    }

    getCurrentTime() {
        hours = currentTime.getHours(),
        minutes = currentTime.getMinutes();
        
        if (minutes < 10) {
            minutes = "0" + minutes;
         }

        this.currentTime = hours + ":" + minutes;
    }

    // getDemand(){}

    // getSupply(){}
}

class Bid {
    // var timestamp = new Date();
    // var currentDate = new Date();
    // var currentTime = new Date();

    // string origin = 0;
    // uint price = 0;
    // var amount = 0;

    constructor(origin, price, amount ){
        getDate();
        getCurrentTime();
        this.timestamp = currentTime + '' + currentDate;
        this.origin = origin;
        this.price = price;
        this.amount = amount;
    }

    getSummary(){
        return (timestamp, origin, price, amount );
    }

    getDate(){
        day = currentDate.getDate();
        month = currentDate.getMonth() + 1;
        year = currentDate.getFullYear();
        this.currentDate = day + "/" + month + "/" + year;
    }

    getCurrentTime() {
        hours = currentTime.getHours(),
        minutes = currentTime.getMinutes();
        
        if (minutes < 10) {
            minutes = "0" + minutes;
         }

         this.currentTime = hours + ":" + minutes;
    }
}