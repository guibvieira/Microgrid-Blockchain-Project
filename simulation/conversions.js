function convertArrayGasToPounds(array, GASPRICE, WEI_IN_ETHER, priceOfEther) {
    let sumCost = array.reduce((a, b) => a + b, 0);
    let calcPrice = sumCost * GASPRICE;
    let costEther = calcPrice / WEI_IN_ETHER;
    let costPounds = costEther * ( parseFloat(priceOfEther.toFixed(18)));
    costPounds = parseFloat(costPounds.toFixed(3));
    return costPounds;
}

function convertArrayWeiToPounds(arrayWei, WEI_IN_ETHER, priceOfEther) {
    let sumCost = arrayWei.reduce((a, b) => a + b, 0);
    let costEther = sumCost / WEI_IN_ETHER;
    let costPounds = costEther * ( parseFloat(priceOfEther.toFixed(18)));
    costPounds = parseFloat(costPounds.toFixed(3));
    return costPounds;
}

function convertWeiToPounds(weiValue,  WEI_IN_ETHER, priceOfEther) {
    let costEther = weiValue / WEI_IN_ETHER;
    let costPounds = costEther * ( parseFloat(priceOfEther.toFixed(18)));
    costPounds = parseFloat(costPounds.toFixed(3));
    return costPounds;
}

function convertGasToPounds(gasCost, GASPRICE, WEI_IN_ETHER, priceOfEther) {
    let calcPrice = gasCost * GASPRICE;
    let costEther = calcPrice / WEI_IN_ETHER;
    let costPounds = costEther * ( parseFloat(priceOfEther.toFixed(18)));
    costPounds = parseFloat(costPounds.toFixed(3));
    return costPounds;
}

module.exports = {convertArrayGasToPounds, convertArrayWeiToPounds, convertWeiToPounds, convertGasToPounds};