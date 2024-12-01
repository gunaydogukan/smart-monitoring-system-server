const { Sequelize } = require('sequelize');

// Veritabanı bağlantısı
const sequelize = new Sequelize('logging_smart_monitoring_system_db', 'root', 'vgzlGya9nIEHKv9', {
    host: 'localhost', // Örneğin: 'localhost'
    dialect: 'mysql', // veya 'postgres', 'sqlite', 'mssql'
    timezone: '+03:00',
});

module.exports = sequelize;
