const { Pool, types } = require('pg');
const config = require('../config/config');

// Parse PostgreSQL NUMERIC types to JavaScript numbers
types.setTypeParser(types.builtins.NUMERIC, (val) => parseFloat(val));

const pool = new Pool(config.db);

async function query(text, params) {
  return pool.query(text, params);
}

async function closePool() {
  return pool.end();
}

module.exports = {
  pool,
  query,
  closePool,
};
