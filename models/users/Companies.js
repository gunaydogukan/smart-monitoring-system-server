const Sequelize = require("sequelize");
const sequelize = require("../../config/database");

const Companies = sequelize.define("companies", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
    },
    plate: {  // city_id yerine plate
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'cities',
            key: "plate", // Burada plate ile referans veriyoruz
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    },
    creator_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: "users",
            key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    },

    code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true // Varsayılan olarak kayıtlar aktif gelir
    }
}, {
    timestamps: true,
});

module.exports = Companies;
