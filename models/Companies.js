const Sequelize = require("sequelize");
const sequelize = require('../config/database');
const Cities = require('../models/Cities.js');
const User = require('../models/User.js');

const Companies = sequelize.define("Companies", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
    },
    creator_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    },
    city_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: Cities,
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