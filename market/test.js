// Data
var booksArray = [
    { origin: 'Lazslo', price: 9     },
    { origin: 'Pig',    price: 8  },
    { origin: 'Pirate', price: 10 },
    { origin: 'Pirate', price: 12 },
    { origin: 'Pirate', price: 14},
    { origin: 'Pirate', price: 5 }
];

// Property to Sort By
var args = "price";

// Function to Sort the Data by given Property
function sortByPropertyBuyer(property) {
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
var sortedArray = booksArray.sort(sortByProperty(args));

console.log("sortedArray: " + JSON.stringify(sortedArray) );