const bcrypt = require('bcrypt');
const User = require('../models/users/User'); // User modeli
const UserLog = require('../models/logging/userLog'); // Log modeli

const updateUser = async (req, res) => {
    const { id } = req.user; // Kimlik doğrulama sonrası gelen kullanıcı ID
    const { name, lastname, email, phone, password } = req.body; // Güncellenmek istenen veriler

    try {
        // Kullanıcıyı veritabanından bul
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        // Eski bilgileri kaydet (log için)
        const oldData = {
            name: user.name,
            lastname: user.lastname,
            email: user.email,
            phone: user.phone,
        };

        // Şifre güncellenmek istenirse hashle
        let hashedPassword = user.password; // Mevcut şifreyi sakla
        if (password && password.trim()) {
            hashedPassword = await bcrypt.hash(password, 10); // Yeni şifreyi hashle
        }

        // Kullanıcı bilgilerini güncelle
        await user.update({
            name,
            lastname,
            email,
            phone,
            password: hashedPassword,
        });

        // Güncelleme işlemini logla
        await UserLog.create({
            userId: id,
            oldData: JSON.stringify(oldData), // Eski bilgileri JSON olarak kaydet
            newData: JSON.stringify({ name, lastname, email, phone }), // Yeni bilgileri JSON olarak kaydet
            action: 'update_profile',
        });

        res.status(200).json({ message: 'Profil başarıyla güncellendi.', user });
    } catch (error) {
        console.error('Güncelleme hatası:', error);
        res.status(500).json({ error: 'Profil güncellenirken bir hata oluştu.' });
    }
};
const validator = require('validator');

const modifyUserDetails = async (req, res) => {
    const { id } = req.body;
    const updates = req.body;

    try {
        // E-posta formatı kontrolü
        if (updates.email && !validator.isEmail(updates.email)) {
            return res.status(400).json({ message: 'Geçersiz e-posta formatı.' });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        // Eski verileri sakla
        const oldData = { ...user.toJSON() };

        // Kullanıcıyı güncelle (şifre hariç)
        const updatedUser = await user.update({
            name: updates.name || user.name,
            lastname: updates.lastname || user.lastname,
            email: updates.email || user.email,
            phone: updates.phone || user.phone,
            companyCode: updates.companyCode || user.companyCode,
        });

        const newData = { ...updatedUser.toJSON() };

        // Loglama
        await UserLog.create({
            userId: id,
            oldData: JSON.stringify(oldData),
            newData: JSON.stringify(newData),
            action: 'modify_user_details',
        });

        res.status(200).json({ message: 'Kullanıcı başarıyla güncellendi.', user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Güncelleme sırasında bir hata oluştu.' });
    }
};



// Kullanıcıyı pasif duruma getirme
const deactivateUser = async (req, res) => {
    const { id } = req.params;
    console.log(`Kullanıcı ID: ${id}`); // Gelen ID'yi kontrol et

    try {
        // Kullanıcıyı veritabanında ara
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        // Kullanıcı zaten pasif mi?
        if (user.isActive === 0) {
            return res.status(400).json({ message: 'Kullanıcı zaten pasif durumda.' });
        }

        // Mevcut durumu sakla (loglama için)
        const oldData = { ...user.toJSON() };

        // Kullanıcı durumunu pasif (isActive = 0) olarak güncelle
        user.isActive = 0;
        const updatedUser = await user.save();

        // Yeni durumu sakla (loglama için)
        const newData = { ...updatedUser.toJSON() };

        // Güncelleme işlemini logla
        await UserLog.create({
            userId: id,
            oldData: JSON.stringify(oldData),
            newData: JSON.stringify(newData),
            action: 'deactivate_user',
        });

        res.status(200).json({
            message: 'Kullanıcı başarıyla pasif duruma getirildi.',
            user: updatedUser,
        });
    } catch (error) {
        console.error('Kullanıcıyı pasif duruma getirirken hata:', error);
        res.status(500).json({ message: 'Kullanıcıyı pasif yapma işlemi sırasında bir hata oluştu.' });
    }
};

const activateUser = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        if (user.isActive === 1) {
            return res.status(400).json({ message: 'Kullanıcı zaten aktif durumda.' });
        }

        user.isActive = 1;
        await user.save();

        res.status(200).json({ message: 'Kullanıcı başarıyla aktif hale getirildi.', user });
    } catch (error) {
        console.error('Kullanıcıyı aktif yapma hatası:', error);
        res.status(500).json({ message: 'Kullanıcıyı aktif yapma sırasında bir hata oluştu.' });
    }
};


module.exports = { updateUser ,modifyUserDetails,deactivateUser,activateUser };
