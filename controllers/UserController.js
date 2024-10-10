const User = require("../models/users/User");
const Company = require("../models/users/Companies");
const Cities = require("../models/users/Cities");
const Districts = require("../models/users/Districts");
const Neighborhoods = require("../models/users/Neighborhoods");
const Villages = require("..//models/users/Villages");


const jwt = require("jsonwebtoken");
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

const register = async (req, res) => {
    try {
        const { name, lastname, email, password, phone, role, creator_id } = req.body;

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: "Bu email adresi zaten kayıtlı." });
        }

        const newUser = await User.create({
            name,
            lastname,
            email,
            password,
            phone,
            role,
            creatorId: role === "administrator" ? null : creator_id,
        });

        res.status(201).json(newUser);
    } catch (error) {
        console.error("Kullanıcı kaydı hatası:", error);
        res.status(500).json({ error: "Kullanıcı kaydı sırasında bir hata oluştu." });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: "Email veya Parola Hatalı" });
        }

        if (user.password !== password) {
            return res.status(400).json({ error: "Email veya Parola Hatalı" });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "2h" });

        res.status(200).json({ token });
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

                // Köyleri ekle
                for (const village of villages) {
                    await Villages.create({
                        neighborhood_id: newNeighborhood.id,
                        village,
                    });
                }
            }
        }

        res.status(201).json({ message: "Adres başarıyla eklendi." });
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




