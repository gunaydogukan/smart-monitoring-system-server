const { Sequelize } = require('sequelize');

require('dotenv').config();
const dbHost = process.env.DB_HOST_FurkanHoca;
const dbUser = process.env.DB_USER_FurkanHoca;
const dbPassword = process.env.DB_PASSWORD_FurkanHoca;
const dbName = process.env.DB_NAME_FurkanHoca_sensorDataDb;

const sequelize = new Sequelize( dbName, dbUser, dbPassword, {
    host: dbHost,
    dialect: 'mysql',
    timezone: '+03:00',
});

module.exports = sequelize;
