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
    }, { timestamps: true });

module.exports = Type;