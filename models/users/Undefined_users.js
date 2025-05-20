const Sequelize = require('sequelize');
const sequelize = require('../../config/database'); // Veritabanı bağlantısı

const UndefinedUser = sequelize.define('undefined_users', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    originalUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Pasif hale getirilen kullanıcının orijinal ID\'si',
    },
    deactivatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'Kullanıcının pasif hale getirildiği tarih',
    },
}, { timestamps: false });

module.exports = UndefinedUser;
