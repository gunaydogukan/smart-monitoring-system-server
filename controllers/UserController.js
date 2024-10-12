const User = require("../models/users/User");
const Company = require("../models/users/Companies");
const Cities = require("../models/users/Cities");
const Districts = require("../models/users/Districts");
const Neighborhoods = require("../models/users/Neighborhoods");
const Villages = require("..//models/users/Villages");
const bcrypt = require("bcrypt");


const jwt = require("jsonwebtoken");
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

const validRoles = ['manager', 'personal']; // İzin verilen roller

const register = async (req, res) => {
    try {
        const { name, lastname, email, password, phone, role } = req.body;

        // Token'dan creator bilgilerini alıyoruz
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Yetkisiz erişim.' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const creator_id = decoded.id;

        console.log("Giriş yapan kullanıcının rolü:", decoded.role);

        // İzin verilmeyen roller eklenmesin (administrator eklenemez)
        if (!validRoles.includes(role)) {
            return res.status(403).json({ error: 'Bu rolü eklemeye yetkiniz yok.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            lastname,
            email,
            password: hashedPassword,
            phone,
            role,
            creator_id, // Oturum açan kullanıcının ID'si
        });

        console.log("Eklenen kullanıcı:", newUser);

        res.status(201).json({ success: true, user: newUser });
    } catch (error) {
        console.error("Kayıt hatası:", error);
        res.status(500).json({ error: 'Kayıt sırasında bir hata oluştu.' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Email ve şifre kontrolü
        if (!email || !password) {
            return res.status(400).json({ error: "Email ve Parola Gereklidir" });
        }

        // Kullanıcıyı veritabanında bul
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: "Email veya Parola Hatalı" });
        }

        // Şifreyi karşılaştır
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: "Email veya Parola Hatalı" });
        }

        // JWT token oluştur
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        console.log("Token:", token);

        // Şifreyi yanıt dışında bırakarak kullanıcı bilgilerini döndür
        const { password: _, ...userWithoutPassword } = user.dataValues;

        res.status(200).json({
            success: true,
            user: userWithoutPassword,
            token: token,
        });
    } catch (error) {
        console.error("Giriş hatası:", error);
        res.status(500).json({ error: "Giriş sırasında bir hata oluştu." });
    }
};


const addAddress = async (req, res) => {
    try {
        // Kullanıcı bilgilerini doğrula (örneğin, JWT token üzerinden)
        const user = req.user; // req.user, doğrulanmış kullanıcıyı temsil eder (middleware tarafından ayarlanır)

        // Eğer kullanıcı yoksa veya rolü "administrator" ya da "manager" değilse hata döner
        if (!user || (user.role !== 'administrator' && user.role !== 'manager')) {
            return res.status(403).json({ error: "Bu işlemi yapmak için yetkiniz yok." });
        }

        const { plate, city, districts } = req.body;

        // Aynı plaka ile kayıtlı bir şehir varsa hata döner
        const existingCity = await Cities.findOne({ where: { plate } });
        if (existingCity) {
            return res.status(400).json({ error: "Bu şehir zaten kayıtlı." });
        }


        let newVillage;

        // Şehir ekle
        const newCity = await Cities.create({
            plate,
            city,
        });

        // İlçe, mahalle ve köyleri ekle
        for (const districtData of districts) {
            const { district, neighborhoods } = districtData;

            // İlçe ekle
            const newDistrict = await Districts.create({
                city_id: newCity.plate,
                district,
            });

            // Mahalle ve köyleri ekle
            for (const neighborhoodData of neighborhoods) {
                const { neighborhood, villages } = neighborhoodData;

                // Mahalle ekle
                const newNeighborhood = await Neighborhoods.create({
                    district_id: newDistrict.id,
                    neighborhood,
                });


                if (!newNeighborhood) {
                    newNeighborhood = await Neighborhoods.create({
                        district_id: newDistrict.id,
                        neighborhood,
                    });
                } else {
                    newNeighborhood = {
                        id: newNeighborhood.id,
                        neighborhood: newNeighborhood.neighborhood,
                    };
                }


                for (const village of villages) {
                    newVillage = await Villages.findOne({
                        where: { village, neighborhood_id: newNeighborhood.id }
                    });

                    if (!newVillage) {
                        newVillage = await Villages.create({
                            neighborhood_id: newNeighborhood.id,
                            village,
                        });
                    }

                // Köyleri ekle
                for (const village of villages) {
                    await Villages.create({
                        neighborhood_id: newNeighborhood.id,
                        village,
                    });

                }
            }
        }
        // Köy bilgisi eklenmediyse uygun bir cevap döndür
        if (!newVillage) {
            return res.status(400).json({
                message: "Köy eklenemedi veya bulunamadı."
            });
        }
        // En son eklenen köyün ID ve ismini döndür
        res.status(201).json({
            message: "Adres başarıyla eklendi.",
            villageId: newVillage?.id, // Optional chaining
            villageName: newVillage?.village, // Köy ismini döndür
        });

    } catch (error) {
        console.error("Adres ekleme hatası:", error);
        res.status(500).json({ error: "Adres ekleme sırasında bir hata oluştu." });
    }
};

const addCompanies = async (req, res) => {
    try {
        // Kullanıcı bilgilerini doğrula (örneğin, JWT token üzerinden)
        const user = req.user; // req.user, doğrulanmış kullanıcıyı temsil eder (middleware tarafından ayarlanır)

        // Eğer kullanıcı yoksa veya rolü "administrator" değilse hata döner
        if (!user || user.role !== 'administrator') {
            return res.status(403).json({ error: "Bu işlemi yapmak için yetkiniz yok." });
        }

        const { code, name, city_id } = req.body;

        // Eğer aynı code ile kayıtlı bir şirket varsa hata döner
        const existingCompany = await Company.findOne({ where: { code } });
        if (existingCompany) {
            return res.status(400).json({ error: "Bu kurum zaten kayıtlı." });
        }

        // Yeni bir şirket oluştur
        const newCompany = await Company.create({
            code,
            name,
            city_id,
            creator_id: user.id, // Kullanıcı ID'si creator olarak atanıyor
        });

        res.status(201).json(newCompany);
    } catch (error) {
        console.log("Kayıt hatası:", error);
        res.status(500).json({ error: "Ekleme sırasında bir hata oluştu." });
    }
};

const addManager = async (req, res) => {
    try {
        // Kullanıcı bilgilerini doğrula (örneğin, JWT token üzerinden)
        const user = req.user; // req.user, doğrulanmış kullanıcıyı temsil eder (middleware tarafından ayarlanır)

        // Eğer kullanıcı yoksa veya rolü "administrator" değilse hata döner
        if (!user || user.role !== 'administrator') {
            return res.status(403).json({ error: "Bu işlemi yapmak için yetkiniz yok." });
        }

        const { name, lastname, email, password, phone, companyCode, creator_id } = req.body;

        // Eğer aynı email ile kayıtlı bir kullanıcı varsa hata döner
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: "Bu email adresi zaten kayıtlı." });
        }

        // Yeni bir manager oluştur
        const newManager = await User.create({
            name,
            lastname,
            email,
            password,
            phone,
            role: "manager",
            creator_id,
            companyCode,
        });

        res.status(201).json(newManager);
    } catch (err) {
        console.error("Manager ekleme hatası:", err);
        res.status(500).json({ error: "Manager ekleme sırasında bir hata oluştu." });
    }
};
const addPersonal = async (req, res) => {
    try {
        // Kullanıcı bilgilerini doğrula (örneğin, JWT token üzerinden)
        const user = req.user; // req.user, doğrulanmış kullanıcıyı temsil eder (middleware tarafından ayarlanır)

        // Eğer kullanıcı yoksa veya rolü "administrator" ya da "manager" değilse hata döner
        if (!user || (user.role !== 'administrator' && user.role !== 'manager')) {
            return res.status(403).json({ error: "Bu işlemi yapmak için yetkiniz yok." });
        }

        const { name, lastname, email, password, phone, companyCode, creator_id } = req.body;

        // Eğer aynı email ile kayıtlı bir kullanıcı varsa hata döner
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: "Bu email adresi zaten kayıtlı." });
        }

        // Yeni bir personal oluştur
        const newPersonal = await User.create({
            name,
            lastname,
            email,
            password,
            phone,
            role: "personal",
            creator_id,
            companyCode,
        });

        res.status(201).json(newPersonal);
    } catch (err) {
        console.error("Personal ekleme hatası:", err);
        res.status(500).json({ error: "Personal ekleme sırasında bir hata oluştu." });
    }
};

module.exports = { register, login, addAddress ,addCompanies , addManager ,addPersonal};




