const bcrypt = require('bcrypt');
const User = require('../../models/users/User'); // User modeli
const UserLog = require('../../models/logging/userLog'); // Log modeli
const UndefinedUser = require('../../models/users/Undefined_users');
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

    try {
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        if (user.isActive === 0) {
            return res.status(400).json({ message: 'Kullanıcı zaten pasif durumda.' });
        }

        // Eğer kullanıcı rolü "personal" ise sadece pasif yap ve log kaydını tut
        if (user.role === 'personal') {
            const oldData = { ...user.toJSON() }; // Eski kullanıcı verilerini al
            user.isActive = 0; // Kullanıcıyı pasif yap
            const updatedUser = await user.save(); // Güncellenmiş kullanıcıyı kaydet

            const newData = { ...updatedUser.toJSON() }; // Yeni kullanıcı verilerini al

            // Log kaydını oluştur
            await UserLog.create({
                userId: id,
                oldData: JSON.stringify(oldData),
                newData: JSON.stringify(newData),
                action: 'deactivate_user',
            });

            return res.status(200).json({
                message: 'Kullanıcı başarıyla pasif hale getirildi.',
                notification: ` pasif hale getirildi.`,
                user: updatedUser,
            });
        }

        // Eğer kullanıcı rolü "manager" ise, mevcut işlemleri gerçekleştirmeye devam et
        const companyCode = user.companyCode;

        if (user.role === 'manager') {
            const activeManagersCount = await User.count({
                where: {
                    companyCode,
                    role: 'manager',
                    isActive: 1,
                },
            });

            if (activeManagersCount <= 1) {
                return res.status(400).json({
                    message: 'Bu kullanıcı kurumda kalan son aktif manager. Pasif yapılamaz.',
                });
            }

            const relatedPersonals = await User.findAll({
                where: {
                    creator_id: id,
                    role: 'personal',
                    isActive: 1,
                },
            });

            // Bağlı personellerin creator_id değerini null yap
            for (const personal of relatedPersonals) {
                personal.creator_id = null;
                await personal.save();
            }

            // Tanımsız kullanıcı kontrolü ve ekleme
            for (const personal of relatedPersonals) {
                const existingUndefinedUser = await UndefinedUser.findOne({
                    where: {
                        originalUserId: personal.id,
                    },
                });

                if (!existingUndefinedUser) {
                    await UndefinedUser.create({
                        originalUserId: personal.id,
                        deactivatedAt: new Date(),
                    });
                }
            }

            const oldData = { ...user.toJSON() };
            user.isActive = 0; // Manager'i pasif yap
            const updatedUser = await user.save();

            const newData = { ...updatedUser.toJSON() };

            await UserLog.create({
                userId: id,
                oldData: JSON.stringify(oldData),
                newData: JSON.stringify(newData),
                action: 'deactivate_user',
            });

            await UndefinedUser.create({
                originalUserId: user.id,
                deactivatedAt: new Date(),
            });

            return res.status(200).json({
                message: 'Kullanıcı başarıyla pasif hale getirildi ve bağlı personeller tanımsız olarak kaydedildi.',
                notification: `pasif yapıldı.`,
                relatedPersonals,
                user: updatedUser,
            });
        }

        // Diğer roller için işlem yapılmaz
        res.status(400).json({ message: 'Bu işlem yalnızca "manager" veya "personal" rolleri için uygulanabilir.' });
    } catch (error) {
        console.error('Kullanıcıyı pasif duruma getirirken hata:', error);
        res.status(500).json({ message: 'Bir hata oluştu.' });
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

        user.isActive = 1; // Kullanıcıyı aktif hale getir
        await user.save();

        // Undefined_users tablosundan kullanıcıyı kaldır
        await UndefinedUser.destroy({ where: { originalUserId: id } });

        // Aktif yapma işlemi için uygun mesaj döndür
        return res.status(200).json({
            message: `Kullanıcı başarıyla aktif hale getirildi .`,
            notification: ` aktif hale getirildi.`,
            user,
        });
    } catch (error) {
        console.error('Kullanıcıyı aktif yapma hatası:', error);
        res.status(500).json({ message: 'Bir hata oluştu.' });
    }
};

const getUndefinedUsersAndActiveManagers = async (req, res) => {
    const { companyCode } = req.params;

    try {
        // Aktif manager'leri getir
        const activeManagers = await User.findAll({
            where: {
                companyCode,
                role: 'manager',
                isActive: 1,
            },
            attributes: ['id', 'name', 'lastname', 'email'],
        });

        // Undefined users tablosundaki tüm kayıtları al
        const undefinedUsers = await UndefinedUser.findAll();

        // Undefined users için `users` tablosundan ilgili bilgileri al
        const undefinedUserDetails = await Promise.all(
            undefinedUsers.map(async (undefinedUser) => {
                const user = await User.findOne({
                    where: { id: undefinedUser.originalUserId },
                    attributes: ['id', 'name', 'lastname', 'email','role'],
                });

                if (!user) {
                    console.warn("Eksik kullanıcı bilgisi:", undefinedUser);
                    return null; // Eksik kullanıcıyı atla
                }

                return {
                    id: undefinedUser.id,
                    user: user.toJSON(),
                };
            })
        );
        console.log("undefinedUserDetails Users Data:", undefinedUserDetails);

        res.status(200).json({
            activeManagers,
            undefinedUsers: undefinedUserDetails.filter((user) => user !== null),
        });

    } catch (error) {
        console.error("Veriler alınırken hata:", error);
        res.status(500).json({ message: "Veriler alınırken bir hata oluştu.", error });
    }
};

const assignPersonalsToManager = async (req, res) => {
    const { managerId, personalIds } = req.body;

    if (!managerId || !Array.isArray(personalIds) || personalIds.length === 0) {
        return res.status(400).json({ message: "Eksik veya geçersiz parametreler." });
    }

    try {
        // Personellerin creator_id'sini güncelle
        await User.update(
            { creator_id: managerId },
            {
                where: {
                    id: personalIds,
                    role: 'personal', // Sadece personel rolü
                },
            }
        );

        // Undefined_users tablosundan bu personelleri sil
        await UndefinedUser.destroy({
            where: {
                originalUserId: personalIds,
            },
        });

        res.status(200).json({ message: "Personeller başarıyla atandı." });
    } catch (error) {
        console.error("Atama sırasında hata:", error);
        res.status(500).json({ message: "Personeller atanırken bir hata oluştu.", error });
    }
};



module.exports = { updateUser ,modifyUserDetails,deactivateUser,activateUser,getUndefinedUsersAndActiveManagers ,assignPersonalsToManager};
