const { DataTypes } = require('sequelize');
const sequelize = require('../../config/logDatabase');

const UserLog = sequelize.define('user_logs', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    oldData: {
        type: DataTypes.TEXT, // Eski bilgiler JSON olarak saklanır
        allowNull: false,
    },
    newData: {
        type: DataTypes.TEXT, // Yeni bilgiler JSON olarak saklanır
        allowNull: false,
    },
    action: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
});

module.exports = UserLog;
