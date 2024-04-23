require('dotenv').config();
const url = require('url');

let dbConfig = {
  username: 'root',
  password: null,
  database: 'booka',
  host: 'localhost',
  dialect: 'postgres',
};

if (process.env.SEQUELIZE_DB) {
  const sequelizeUrl = new url.URL(process.env.SEQUELIZE_DB);
  dbConfig = {
    username: sequelizeUrl.username,
    password: sequelizeUrl.password,
    database: sequelizeUrl.pathname.substring(1),
    host: sequelizeUrl.hostname,
    dialect: sequelizeUrl.protocol.slice(0, -1),
    port: sequelizeUrl.port,
  };


  console.log(dbConfig);
}

module.exports = {
  development: dbConfig,
  test: dbConfig,
  production: dbConfig,
};