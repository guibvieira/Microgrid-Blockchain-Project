var fs = require('xfs');
let csv = require('fast-csv');
let parse = require('csv-parse');

function calcDate(date) {
    let date = new Date(parseInt(date));
    date = date.toLocaleString();
    return date;
}



