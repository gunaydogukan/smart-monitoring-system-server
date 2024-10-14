const Sequelize = require('sequelize');  // Sequelize kütüphanesini dahil ediyoruz
const sequelize = require('../../config/database'); // Veritabanı bağlantısını içe aktarıyoruz
const Companies = require('../users/Companies'); // Şirket modelini dahil ediyoruz

const User = sequelize.define('users', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    role: {
        type: Sequelize.ENUM('administrator', 'manager', 'personal'),
        allowNull: false,
    },
    creator_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    companyCode: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
            model: Companies, // Companies modeline referans
            key: 'code',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    lastname: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    phone: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
    },
    isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, { timestamps: true });


module.exports = User;
