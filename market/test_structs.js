const Struct = (...keys) => ((...v) => keys.reduce((o, k, i) => {o[k] = v[i]; return o} , {}))
const Item = Struct('id', 'price', 'country')
var myItems = [
    Item(1, 6, 'au'),
    // Item(2, 5, 'us'),
    // Item(3, 8, 'us'),
    // Item(4, 9, 'us'),
    // Item(5, 7, 'us'),
    // Item(6, 10, 'us'),
    // Item(7, 4, 'us'),
];

function createItems (id, price, country) {
    myItems.push(Item(id, price, country))
}

for (i = 0; i < 10; i++) {
    createItems(i,i, 'us');
}
// console.log(myItems);
// console.log(myItems[0].id);
// console.log(myItems[0].speaker);
// console.log(myItems[0].country);

// Property to Sort By
var args = "price";

// Function to Sort the Data by given Property
function sortByProperty(property) {
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

// Implementation
var sortedArray = myItems.sort(sortByProperty(args));

console.log("sortedArray: " + JSON.stringify(sortedArray) );