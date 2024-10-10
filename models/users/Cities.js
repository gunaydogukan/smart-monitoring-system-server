const Sequelize = require("sequelize");
const sequelize = require("../../config/database");

const cities = sequelize.define("cities",{

    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    plate: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false
    },
    city: {
        type: Sequelize.STRING,
        allowNull: false
    }

} ,{ timestamps: true });

module.exports = cities;