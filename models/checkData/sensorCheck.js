// Model dosyanız (sensor_check.js)
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/checkData/checkDatabase');

const SensorCheck = sequelize.define('sensor_check', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    tur: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    lat: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    lng: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    sagUstNem: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
    },
    sagAltNem: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
    },
    solAltNem: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
    },
    yagis: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
    },
    mesafe: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
    },
    turkcell: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
    },
    vodafone: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
    },
    turkTelekom: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
    }
}, { timestamps: true });

module.exports = SensorCheck;