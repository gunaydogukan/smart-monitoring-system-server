const Sequelize = require('sequelize');
const sequelize = require('../../config/database');
const { DataTypes } = require('sequelize');

// Dinamik sensör data table oluşturma
const SensorData = async (sensor) => {
    const tableName = `${sensor.datacode}`;

    // Sensör tipine göre tablo yapısı belirleniyor
    const tableFields = sensor.type === 1 ? {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true // id otomatik artan olsun
        },
        N001: { type: Sequelize.FLOAT, allowNull: false },
        S001: { type: Sequelize.FLOAT, allowNull: false },
        N002: { type: Sequelize.FLOAT, allowNull: false },
        S002: { type: Sequelize.FLOAT, allowNull: false },
        N003: { type: Sequelize.FLOAT, allowNull: false },
        S003: { type: Sequelize.FLOAT, allowNull: false },
        datetime: { type: Sequelize.DATE, allowNull: false }, // Tarih ve saat tek alan
    } : {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true // id otomatik artan olsun
        },
        D001: { type: Sequelize.STRING, allowNull: false },
        datetime: { type: DataTypes.DATE, allowNull: false }, // Tarih ve saat tek alan
    };

    // Dinamik tabloyu oluştur
    const SensorDataTable = sequelize.define(tableName, tableFields, {
        timestamps: false, // createdAt, updatedAt gibi alanlar olmaması için
        freezeTableName: true, // Tablonun isminin değiştirilmesini engelle
    });

    // Eğer tablo yoksa oluşturuluyor
    await SensorDataTable.sync();
    return SensorDataTable;
};

module.exports = { SensorData };
