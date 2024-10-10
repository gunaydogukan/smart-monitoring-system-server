const User = require("../models/User");
const Cities = require("../models/Cities");
const Districts = require("../models/Districts");
const Neighborhoods = require("../models/Neighborhoods");
const Villages = require("../models/Villages");

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

const addCities = async (req, res, next) => {
    try {
        const { plate, city } = req.body;

        // Şehir zaten var mı kontrol et
        const existingCity = await Cities.findOne({ where: { plate } });
        if (existingCity) {
            return res.status(400).json({ error: "Bu şehir zaten kayıtlı." });
        }

        // Yeni şehir oluştur
        const newCity = await Cities.create({
            plate,
            city,
        });

        res.status(201).json(newCity);
    } catch (error) {
        console.error("Şehir ekleme hatası:", error);
        res.status(500).json({ error: "Şehir ekleme sırasında bir hata oluştu." });
    }
};

module.exports = { register, login, addCities };
