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
const validRoles = ['manager', 'personal'];
 // İzin verilen roller

const register = async (req, res) => {
    try {
        const { name, lastname, email, password, phone, role, companyCode } = req.body;

        // Token'dan creator bilgilerini alıyoruz
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Yetkisiz erişim.' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const creator_id = decoded.id;
        console.log(creator_id);
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
            creator_id:creator_id, // Oturum açan kullanıcının ID'si
            companyCode, // Şirket kodunu ekliyoruz
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
        console.log("deneme");
        // Kullanıcıyı email ile bul
        const user = await User.findOne({ where: { email } });
        console.log(user);
        if (!user) {
            return res.status(400).json({ error: "Email veya şifre hatalı." });
        }
        console.log(user.password);
        // Şifreyi karşılaştır
        const isPasswordValid = await bcrypt.compare(password, user.password);

        console.log(password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: "Email veya şifre hatalı." });
        }
        console.log("deneme")
        // Token oluştur
        const token = jwt.sign(
            { id: user.id, role: user.role }, // Payload
            JWT_SECRET, // Secret key
            { expiresIn: "2h" } // Token süresi
        );
        console.log(token);
        // Yanıt döndür
        res.status(200).json({
            success: true,
            token: token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });

    } catch (error) {
        console.error("Giriş hatası:", error);
        res.status(500).json({ error: "Giriş sırasında bir hata oluştu." });
    }
};


const addAddress = async (req, res) => {
    try {
        const user = req.user;

        // Kullanıcı yetkisi kontrolü
        if (!user || (user.role !== 'administrator' && user.role !== 'manager')) {
            return res.status(403).json({ error: "Bu işlemi yapmak için yetkiniz yok." });
        }

        const { plate, city, districts } = req.body;

        // Şehir kontrolü: Aynı plaka varsa onu kullan, yoksa yeni şehir ekle
        let newCity = await Cities.findOne({ where: { plate } });

        if (!newCity) {
            newCity = await Cities.create({ plate, city });
        } else {
            console.log(`Bu şehir zaten kayıtlı. Plaka: ${newCity.plate}`);
        }

        let newDistrict;
        let newNeighborhood;
        let newVillage;

        // İlçe, mahalle ve köy ekleme işlemleri
        for (const districtData of districts) {
            const { district, neighborhoods } = districtData;

            // İlçe kontrolü ve ekleme
            newDistrict = await Districts.findOne({
                where: { district, city_id: newCity.plate },
            });

            if (!newDistrict) {
                newDistrict = await Districts.create({
                    city_id: newCity.plate,
                    district,
                });
            } else {
                console.log(`Bu ilçe zaten kayıtlı: ${newDistrict.district}`);
            }

            for (const neighborhoodData of neighborhoods) {
                const { neighborhood, villages } = neighborhoodData;

                // Mahalle kontrolü ve ekleme
                newNeighborhood = await Neighborhoods.findOne({
                    where: { neighborhood, district_id: newDistrict.id },
                });

                if (!newNeighborhood) {
                    newNeighborhood = await Neighborhoods.create({
                        district_id: newDistrict.id,
                        neighborhood,
                    });
                } else {
                    console.log(`Bu mahalle zaten kayıtlı: ${newNeighborhood.neighborhood}`);
                }

                for (const village of villages) {
                    // Köy kontrolü ve ekleme
                    newVillage = await Villages.findOne({
                        where: { village, neighborhood_id: newNeighborhood.id },
                    });

                    if (!newVillage) {
                        newVillage = await Villages.create({
                            neighborhood_id: newNeighborhood.id,
                            village,
                        });
                    } else {
                        console.log(`Bu köy zaten kayıtlı: ${newVillage.village}`);
                    }
                }
            }
        }

        // Köy eklenip eklenmediğini kontrol et
        if (!newVillage) {
            return res.status(400).json({ message: "Köy eklenemedi veya bulunamadı." });
        }

        // Başarılı işlem sonucunda yanıt dön
        res.status(201).json({
            message: "Adres başarıyla eklendi.",
            villageId: newVillage.id, // Köy ID'si
            villageName: newVillage.village, // Köy ismi
        });

    } catch (error) {
        console.error("Adres ekleme hatası:", error);
        res.status(500).json({ error: "Adres ekleme sırasında bir hata oluştu." });
    }
};
const addCompanies = async (req, res) => {
    try {
        const user = req.user; // Auth middleware'den gelen kullanıcı bilgisi

        // Sadece administrator ekleyebilecek
        if (!user || user.role !== 'administrator') {
            return res.status(403).json({ error: "Bu işlemi yapmak için yetkiniz yok." });
        }

        const { code, name, city_id } = req.body;

        // Aynı kodla bir şirket olup olmadığını kontrol et
        const existingCompany = await Company.findOne({ where: { code } });
        if (existingCompany) {
            return res.status(400).json({ error: "Bu kurum zaten kayıtlı." });
        }

        // Yeni bir kurum oluştur
        const newCompany = await Company.create({
            code,
            name,
            city_id,
            creator_id: user.id, // Şirketi ekleyen kullanıcının ID'si
        });

        res.status(201).json(newCompany);
    } catch (error) {
        console.error("Kayıt hatası:", error);
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

// Tüm şirketleri listeleme
const getCompanies = async (req, res) => {
    try {
        const companies = await Company.findAll();
        res.status(200).json(companies);
    } catch (error) {
        console.error('Şirketleri getirirken hata:', error);
        res.status(500).json({ error: 'Şirketler getirilemedi.' });
    }
};

// Tüm şehirleri listeleme
const getCities = async (req, res) => {
    try {
        const cities = await Cities.findAll();
        res.status(200).json(cities);
    } catch (error) {
        console.error('Şehirleri çekerken hata:', error);
        res.status(500).json({ error: 'Şehirleri yüklerken hata oluştu.' });
    }
};



const getProfile = async (req, res) => {
    try {
        // Kullanıcıyı bulma
        const user = await User.findOne({
            where: { id: req.user.id },
            attributes: ['id', 'companyCode', 'name', 'lastname', 'email', 'phone', 'role'], // Kullanıcı bilgileri

        });
        console.log(user.companyCode);
        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        // Kullanıcının companyCode'una göre şirketi bulma
        const company = await Company.findOne({
            where: { code: user.companyCode },
            attributes: ['name', 'code'], // Şirket bilgileri
        });

        // Şirket bulunamazsa hata döndür
        if (!company) {
            return res.status(404).json({ error: 'Kullanıcının bağlı olduğu şirket bulunamadı.' });
        }

        // Kullanıcı ve şirket bilgilerini birleştirip dön
        const response = {
            ...user.toJSON(),
            companyName: company.name,
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Profil bilgisi hatası:', error);
        res.status(500).json({ error: 'Profil bilgisi alınamadı.', message: error.message });
    }
};






const getUsers = async (req, res) =>{
    //token'den gelen rol kontrolü
    const {role} = req.user;
    const adminId = req.user.id;

    if (role !== 'administrator' && role !== 'manager') {
        return res.status(403).json({ message: 'Bu işlemi yapmak için yetkiniz yok.' });
    }

    if(role ==='administrator'){

        const managers = await User.findAll({
            where: {
                role: 'manager',
                creator_id: adminId },
        });

        if (!managers.length) {
            return res.status(404).json({ message: 'Hiç manager bulunamadı.' });
        }

        res.status(200).json(managers); // manager'i gönderdik

    }else{
        //user'a sensör tanımlama işlemi sonra yapılacak
    }

};


module.exports = { register, login, addAddress ,addCompanies , addManager ,addPersonal,getCompanies,getCities, getProfile,getUsers};




