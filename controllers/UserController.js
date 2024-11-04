const User = require("../models/users/User");
const Company = require("../models/users/Companies");
const Cities = require("../models/users/Cities");
const Districts = require("../models/users/Districts");
const Neighborhoods = require("../models/users/Neighborhoods");
const Villages = require("..//models/users/Villages");
const { getAllCompanies } = require('../services/companyServices');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;
const validRoles = ['manager', 'personal'];
 // İzin verilen roller

const register = async (req, res) => {
    try {
        const { name, lastname, email, password, phone, role, companyCode, creator_id: formCreatorId } = req.body;

        // Token'dan creator bilgilerini alıyoruz
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Yetkisiz erişim.' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        let creator_id = decoded.id; // Varsayılan olarak oturum açan kullanıcının ID'si

        // Eğer personal ekleniyorsa, formdan gelen manager ID'sini kullan
        if (role === 'personal') {
            creator_id = formCreatorId; // Personal için formdan gelen creator_id kullanılır
        }

        console.log("Kayıt edilen kullanıcının creator_id'si:", creator_id);

        // Geçersiz roller eklenmesin
        if (!validRoles.includes(role)) {
            return res.status(403).json({ error: 'Bu rolü eklemeye yetkiniz yok.' });
        }

        // Telefon numarasının benzersiz olup olmadığını kontrol et
        const existingUser = await User.findOne({ where: { phone } });
        if (existingUser) {
            return res.status(409).json({ error: 'Bu telefon numarası zaten kayıtlı.' }); // 409 Conflict
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Yeni kullanıcıyı oluştur
        const newUser = await User.create({
            name,
            lastname,
            email,
            password: hashedPassword,
            phone,
            role,
            creator_id, // Manager ekleniyorsa token'dan, personal ekleniyorsa formdan
            companyCode, // Şirket kodu
        });

        console.log("Eklenen kullanıcı:", newUser);

        res.status(201).json({ success: true, user: newUser });
    } catch (error) {
        console.error("Kayıt hatası:", error);

        // Unique constraint veya diğer hatalar için kontrol
        if (error.name === 'SequelizeUniqueConstraintError') {
            res.status(409).json({ error: 'E-posta veya telefon numarası zaten kayıtlı.' });
        } else {
            res.status(500).json({ error: 'Kayıt sırasında bir hata oluştu.' });
        }
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Gelen Body:", req.body);

        // Gelen verileri kontrol et
        if (!email || !password) {
            return res.status(400).json({ error: "Email ve şifre gerekli." });
        }

        console.log("Body:", req.body);

        // Kullanıcıyı email ile bul
        const user = await User.findOne({ where: { email } });
        console.log("Kullanıcı:", user);

        if (!user) {
            return res.status(400).json({ error: "Email veya şifre hatalı." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ error: "Email veya şifre hatalı." });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: "2h" }
        );

        res.status(200).json({
            success: true,
            token,
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
        const user = req.user; // Middleware'den gelen kullanıcı bilgisi

        // Kullanıcı yetkisi kontrolü
        if (!user || (user.role !== 'administrator' && user.role !== 'manager')) {
            return res.status(403).json({ error: "Bu işlemi yapmak için yetkiniz yok." });
        }

        /*
                       plate: parseInt(selectedProvinceId),
            city: searchProvince,
            districts: [
                {
                    district: searchDistrict,
                    neighborhoods: selectedNeighborhoodId ? [
                        {
                            neighborhood: searchNeighborhood,
                            villages: [village],
                        },
                    ] : [],   //burada mahalle' boşsa ' eğer boş dönecek...
                    villages: selectedNeighborhoodId ? [] : [village],
                },
            ],
        };
        Gelen veri bu yapıda geliyor
         */

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
            const { district, neighborhoods, villages } = districtData;

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

            // Mahalle ekleme işlemi , eğer mahalle girildiyse...
            if (neighborhoods && neighborhoods.length > 0) {
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

                    // Köy ekleme işlemi
                    for (const village of villages) {
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
            else {// Mahalle yoksa sadece köyleri ekle

                newNeighborhood = await Neighborhoods.findOne({
                    where: { neighborhood: `${district} - Mahalle_Secilmedi`, district_id: newDistrict.id },
                });

                if (!newNeighborhood) {
                    newNeighborhood = await Neighborhoods.create({
                        district_id: newDistrict.id,
                        neighborhood: `${district} - Mahalle_Secilmedi`,
                    });
                } else {
                    console.log(`Bu mahalle zaten kayıtlı: ${newNeighborhood.neighborhood}`);
                }

                for (const village of villages) {

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
            villageId: newVillage.id,
            villageName: newVillage.village,
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

        const { code, name, plate, city } = req.body;

        // Aynı kodla bir şirket olup olmadığını kontrol et
        const existingCompany = await Company.findOne({ where: { code } });
        if (existingCompany) {
            return res.status(400).json({ error: "Bu kurum zaten kayıtlı." });
        }

        // Şehir kontrolü ve yeni şehir ekleme (eğer gerekirse)
        let newCity;
        const existingCity = await Cities.findOne({ where: { plate } });
        if (!existingCity) {
            newCity = await Cities.create({ plate, city });
        }

        // Yeni bir kurum oluştur
        const newCompany = await Company.create({
            code,
            name,
            plate, // Şirketin bağlı olduğu şehrin plakası
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
        const companies = await getAllCompanies(); //servicesten çekiyor ...
        res.status(200).json( companies);
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

        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }


        // Kullanıcının companyCode'una göre şirketi bulma
        let company = await Company.findOne({
            where: { code: user.companyCode },
            attributes: ['name', 'code'], // Şirket bilgileri
        });

        // Şirket bulunamazsa hata döndür
        if (!company) {
            if (user.role !== "administrator") {
                return res.status(404).json({error: 'Kullanıcının bağlı olduğu şirket bulunamadı.'});
            } else {
                company = "Admin kuruma sahip değildir.";
            }


        company = null;
        }

        // Eğer kullanıcı administrator ise company bilgisi olmayacak
        if (user.role !== 'administrator' && user.companyCode) {
            // Kullanıcının companyCode'una göre şirketi bulma
            company = await Company.findOne({
                where: { code: user.companyCode },
                attributes: ['name', 'code'], // Şirket bilgileri
            });

        }

        // Kullanıcı ve şirket bilgilerini birleştirip dön
        const response = {
            ...user.toJSON(),
            companyName: user.role === 'administrator' ? null : (company ? company.name : null), // Eğer administrator ise companyName null
        };

        res.status(200).json(response);
    }
        catch (error) {
        console.error('Profil bilgisi hatası:', error);
        res.status(500).json({ error: 'Profil bilgisi alınamadı.' });
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

const getManagersByCompany = async (req, res) => {
    const { companyCode } = req.query;

    try {
        let managers;

        if (companyCode) {
            // Eğer companyCode varsa, o şirkete ait manager'ları getir
            managers = await User.findAll({
                where: {
                    companyCode: companyCode,
                    role: 'manager' // Sadece manager rolü olanları getir
                }
            });
        } else {
            // Eğer companyCode yoksa, tüm manager'ları getir
            managers = await User.findAll({
                where: {
                    role: 'manager' // Sadece manager rolü olanları getir
                }
            });
        }

        res.json(managers);
    } catch (error) {
        console.error('Manager verisi çekilemedi:', error);
        res.status(500).json({ message: 'Manager verisi çekilemedi' });
    }
};

const getPersonalsByCompany = async (req, res) => {
    const { companyCode } = req.query;

    try {
        let personals;

        if (companyCode) {
            // Eğer companyCode varsa, o şirkete ait personal'ları getir
            personals = await User.findAll({
                where: {
                    companyCode: companyCode,
                    role: 'personal' // Sadece personal rolü olanları getir
                }
            });
        } else {
            // Eğer companyCode yoksa, tüm personal'ları getir
            personals = await User.findAll({
                where: {
                    role: 'personal' // Sadece personal rolü olanları getir
                }
            });
        }

        res.json(personals);
    } catch (error) {
        console.error('Personal verisi çekilemedi:', error);
        res.status(500).json({ message: 'Personal verisi çekilemedi' });
    }
};

const getUserCount = async (req,res) =>{
    const {role} = req.user; //giren kişinin bilgilerini alınır
    const companies = await getAllCompanies();

    //bu işlevi sadece admin görebilir
    if(role != 'administrator'){
        return "";
    }

    //kullanıcıları alır
    const users = await User.findAll({
        attributes : ['companyCode' , 'role'],
    });

    console.log(companies);

    //gruplama işlemi burada yapılıyor
    //reduce = bir diziyi belirli kurala göre tek değer veya karmaşık bir yapıya dönüştürür
    //bu fonk sırasıyla bir işlem yapar acc (accumulator) güncelleyerek son sonuç üretir
    const groupedUserCounts = users.reduce((acc, user) => {
        const {companyCode,role} = user;
        console.log("acc değeri = ",acc);
        console.log("userlar = ",user);
        console.log("companyCode = ",companyCode);
        console.log("role = ",role);

        //burada bir yapı oluşturduk
        if((role !== 'administrator' && companyCode!==null) &&!acc[companyCode]){
            acc[companyCode] = { total: 0, managerCount: 0, personalCount: 0 };
        }

        if((role !== 'administrator' && companyCode!==null)){
            acc[companyCode].total +=1; //yapıdaki totali bir arttır
        }

        if(role === "manager"){
            acc[companyCode].managerCount+=1;
        }

        if(role === "personal"){
            acc[companyCode].personalCount+=1;

        }
        return acc; //sonucu döndür
    },{});
    console.log("klhkljhjklhlkjhlkhk",groupedUserCounts);
    //companies ' lere göre sonuçları göster
    const result = companies.map(company =>{
        const companyCode = company.dataValues.code; // 'code' alanı 'companyCode' olarak kullanılıyor
        //eğer listede eşleşiyorsa yaz   //eşleşmiyorsa 0
        const userCounts = groupedUserCounts[companyCode] || { total: 0, managerCount: 0, personalCount: 0 };
        console.log("userCount = ",userCounts);
        return {
            id:company.dataValues.id,
            code:companyCode,
            name: company.dataValues.name, // Şirket ismi için 'name' alanı kullanılıyor
            plate:company.dataValues.plate,
            total: userCounts.total,
            mcount: userCounts.managerCount,
            pcount: userCounts.personalCount
        };
    });

    res.status(200).json(result);
};

module.exports = { register, login, addAddress ,addCompanies , addManager ,addPersonal,getCompanies,getCities, getProfile,getUsers,getManagersByCompany,getPersonalsByCompany,getUserCount};




