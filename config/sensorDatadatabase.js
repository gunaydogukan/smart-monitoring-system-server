const { Sequelize } = require('sequelize');
//Sensör data'ları bu database'de saklanacak
const sequelize = new Sequelize('sensor_data', 'root', 'dogukan1903', {
    host: 'localhost',
    dialect: 'mysql',
    timezone: '+03:00',
});

module.exports = sequelize;
