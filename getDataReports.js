const axios = require('axios');
const Json2csvParser = require('json2csv').Parser;
const CircularJSON = require('circular-json')

let data = 0;
axios.get('https://www.bmreports.com/bmrs/?q=ajax/alldata/DERSYSDATA/settlementDate,Period,SSP,SBP,BD,PDC,RSP,NIV,SPA,BPA,RP,RPRV,OV,BV,TOV,TBV,ASV,ABV,TASV,TABV,Linkstodata/NULL/2017-01-01')
  .then(function (response) {
    //data = response;
    try {
        data = CircularJSON.stringify(response);
        console.log(data);
   
        const fields = ['settlementDate','Period','SSP','SBP','BD','PDC','RSP','NIV','SPA','BPA','RP','RPRV','OV','BV','TOV','TBV','ASV','ABV','TASV','TABV'];
        const opts = { fields };
        const parser = new Json2csvParser();
        const csv = parser.parse(data);
        console.log(csv);
      } catch (err) {
        console.error(err);
      }
  })
  .catch(function (error) {
    console.log(error);
  });

 
