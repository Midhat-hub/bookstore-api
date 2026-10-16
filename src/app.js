const express = require('express');
const database = require('./db/database');
const bookRoutes = require('./routes/bookRoutes');
const errorHandler = require('./middleware/errorHandler');

function createApp(customDb = database) {
  const app = express();

  app.locals.db = customDb;

  app.use(express.json());

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
  });

  app.use('/api/books', bookRoutes);

  app.use(errorHandler);

  return app;
}

module.exports = createApp;
