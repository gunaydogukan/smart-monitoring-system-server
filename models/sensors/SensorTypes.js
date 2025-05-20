const Sequelize = require("sequelize");
const sequelize = require("../../config/database");

const Type = sequelize.define("sensors_types_tables", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
        },
        type: {
            type: Sequelize.STRING,
            allowNull: false,
            unique:true,
        },
        dataCount: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        dataNames: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
    }, { timestamps: true });

module.exports = Type;