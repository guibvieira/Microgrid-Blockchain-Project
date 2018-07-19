const routes = require('next-routes')();

routes
    .add('household', '/households/:address', 'households/household');

module.exports = routes;