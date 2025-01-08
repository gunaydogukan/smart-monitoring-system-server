const Sequelize = require("sequelize");
const sequelize = require('../../config/LogDatabase');

// latest_sensor_data tablosunun modeli
const LatestSensorData = sequelize.define('latest_sensor_data', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    dataCode: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
    },
    lastUpdatedTime: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    data: {
        type: Sequelize.JSON, // JSON formatında veriler için
        allowNull: true, // İsteğe bağlı
    },
}, {
    timestamps: false,
});

module.exports = LatestSensorData;