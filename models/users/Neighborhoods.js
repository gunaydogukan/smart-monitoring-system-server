const Sequelize = require('sequelize');
const sequelize = require("../../config/database");

const neighborhoods = sequelize.define("neighborhoods",{
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    district_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model:"districts",
            key:"id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    },
    neighborhood:{
        type: Sequelize.STRING,
        allowNull: false
    }
},{ timestamps: true });

module.exports = neighborhoods;
