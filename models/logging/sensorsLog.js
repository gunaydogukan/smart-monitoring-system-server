const { DataTypes } = require('sequelize');
const sequelize = require('../../config/logDatabase');

const SensorLogs = sequelize.define('sensor_logs', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    sensorId: {
        type: DataTypes.INTEGER, // Sensör ID, frontend'den alınacak
        allowNull: false,
    },
    oldData: {
        type: DataTypes.TEXT, // Eski sensör bilgilerini JSON olarak saklar
        allowNull: false,
    },
    newData: {
        type: DataTypes.TEXT, // Yeni sensör bilgilerini JSON olarak saklar
        allowNull: false,
    },
    action: {
        type: DataTypes.STRING, // Örneğin: 'update', 'create', 'delete'
        allowNull: false,
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    timestamps: false,
});

module.exports = SensorLogs;
