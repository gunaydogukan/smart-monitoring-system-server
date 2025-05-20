const Sequelize = require("sequelize");
const sequelize = require('../../config/LogDatabase');

const Log = sequelize.define("IP_logger", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
    },
    datacode: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
    },
    IP_Adresses: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
        defaultValue: null,  // Varsayılan değer ilk null olur , ip çalıştığında , soket ile ip alınıp ip_adresses ismi değişir
    },
}, {
    timestamps: true, // createdAt ve updatedAt alanlarını otomatik olarak eklenir
    tableName: 'IP_logger', // tablo adı açıkça belli olur
});

module.exports = Log;