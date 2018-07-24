const routes = require('next-routes')();

routes
    .add('household', '/households/:address', 'households/household')
    .add('exchange', '/households/:address/exchange', '/households/exchange/exchange');

module.exports = routes;