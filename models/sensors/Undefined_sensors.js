const Sequelize = require('sequelize');
const sequelize = require('../../config/database'); // Veritabanı bağlantısı

const UndefinedSensor = sequelize.define('undefined_sensors', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    originalSensorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'sensors',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    },
    deactivatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
    },
}, { timestamps: false });

module.exports = UndefinedSensor;
