const { Sequelize } = require('sequelize');
//Sensor IP logs managment system
const sequelize = new Sequelize('logging_smart_monitoring_system_db', 'root', 'vgzlGya9nIEHKv9', {
    host: 'localhost',
    dialect: 'mysql',
    timezone: '+03:00',
});

module.exports = sequelize;
