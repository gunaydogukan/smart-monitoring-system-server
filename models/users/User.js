const Sequelize = require('sequelize');
const sequelize = require('../../config/database'); // Veritabanı bağlantısı
//const Companies = require('../users/Companies'); // Şirket modelini içe aktarıyoruz

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
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
    },
    companyCode: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
            model: 'Companies',
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
