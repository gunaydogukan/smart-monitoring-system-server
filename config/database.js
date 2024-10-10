const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('smart_monitoring_system_db', 'root', 'dogukan1903', {
    host: 'localhost',
    dialect: 'mysql',
    timezone: '+03:00',
});

module.exports = sequelize;
