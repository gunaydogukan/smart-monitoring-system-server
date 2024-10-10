const Sequelize = require('sequelize');
const sequelize = require('../config/database');


const villages = sequelize.define("villages",{
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    neighborhood_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model:"neighborhoods",
            key:"id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    },
    village:{
        type: Sequelize.STRING,
        allowNull: false
    }
},{ timestamps: true });

module.exports = villages;
