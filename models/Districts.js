const Sequelize = require("sequelize");
const sequelize = require('../config/database');
const {DataTypes} = require("sequelize");

const districts = sequelize.define("districts",{
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    city_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "cities",
            key: "plate",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    },
    district: {
        type : Sequelize.STRING,
        allowNull: false
    }
},{ timestamps: true });

module.exports = districts;
