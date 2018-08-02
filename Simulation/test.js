// Data

let historicalDemand = [
    [1,2],
    [2,3],
    [3,4],
    [4,5],
    [5,6],
    [6,7],
    [8,9],
    [12,3],
    [43,65]
]
function predictorRandom(row){
    let timeInterval = 5;
        let randomArray = new Array();
        if( row <= timeInterval){
            return historicalDemand[row];
        }
        for(i=row-timeInterval; i < row; i++){
            randomArray.push(historicalDemand[i][1]);
        }
        return randomArray[Math.floor(Math.random() * randomArray.length)];
}

console.log(predictorRandom(7));

