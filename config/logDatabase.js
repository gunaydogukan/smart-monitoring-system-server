const { Sequelize } = require('sequelize');

// Veritabanı bağlantısı
const sequelize = new Sequelize('logging_smart_monitoring_system_db', 'root', 'dogukan1903', {
    host: 'localhost', // Örneğin: 'localhost'
    dialect: 'mysql', // veya 'postgres', 'sqlite', 'mssql'
    timezone: '+03:00',
    logging: false, // Konsolda SQL çıktısını devre dışı bırakır
});

module.exports = sequelize;
