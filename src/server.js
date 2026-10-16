const config = require('./config/config');
const createApp = require('./app');

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`Bookstore API listening on port ${config.port}`);
});

module.exports = server;
