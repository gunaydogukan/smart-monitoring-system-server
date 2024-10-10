const { DataTypes } = require('sequelize');
const sequelize = require("../../config/database"); // Sequelize bağlantını buraya eklemelisin

const Sensors = sequelize.define('sensors', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    datacode: {
        type: DataTypes.STRING,
        allowNull: false,
        unique:true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    lat: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    lng: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    def: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    type: {
        type: DataTypes.INTEGER,
        references: {
            model: 'sensors_types_tables', // Referans alınacak tablo adı
            key: 'id',
        },
        allowNull: false,
    },
    company_code: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    creator_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'users', // Referans alınacak tablo adı (örneğin, users tablosu)
            key: 'id',
        },
        allowNull: false,
    },
    village_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'villages', // Referans alınacak tablo adı (örneğin, villages tablosu)
            key: 'id',
        },
        allowNull: false,
    },
}, {
    timestamps: true, // createdAt ve updatedAt alanlarını otomatik olarak ekler
});

module.exports = Sensors;