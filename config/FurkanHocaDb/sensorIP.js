const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('sensorIP', 'bitirmeproje', 'Bitirme74Projesi74!', {
    host: '193.255.91.36',
    dialect: 'mysql',
    timezone: '+03:00',
});

module.exports = sequelize;
