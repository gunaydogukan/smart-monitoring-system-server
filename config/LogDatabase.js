const { Sequelize } = require('sequelize');
//Sensor IP logs managment system
const sequelize = new Sequelize('log_smart_monitoring_system_db', 'root', 'dogukan1903', {
    host: 'localhost',
    dialect: 'mysql',
    timezone: '+03:00',
});

module.exports = sequelize;
