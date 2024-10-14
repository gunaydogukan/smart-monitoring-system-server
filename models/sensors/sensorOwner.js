const Sequelize = require("sequelize");
const sequelize = require("../../config/database");

const Type = sequelize.define("sensors_owner", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
    },
    sensor_owner: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'users', // Referans alınacak tablo adı
            key: 'id',
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    },
    sensor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'sensors', // Referans alınacak tablo adı
            key: 'id',
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    }
}, { timestamps: true });

module.exports = Type;