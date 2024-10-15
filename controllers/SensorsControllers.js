const Type = require("../models/sensors/SensorTypes");
const Sensors = require('../models/sensors/Sensors'); // Sensors modelini içe aktar
const SensorOwner = require('../models/sensors/sensorOwner');
const Companies = require('../models/users/Companies');
const Users = require('../models/users/User');
const { getAllSensors,getSensorIdsByOwner,getSensorsByIds} = require('../services/sensorServices');

const addSensors = async (req, res) => {
    try {
        const user = req.user;
        console.log(user.role);
        // Kullanıcı yetkisini kontrol et
        if (user.role === "personal" || !user) {
            return res.status(400).json({
                message: 'Bu işlemi yapmaya yetkiniz yoktur. Lütfen yetkili birisine ulaşınız.',
            });
        }

        // Gelen veriyi kontrol et
        console.log('Gelen Veri:', req.body); // Burada datanın nasıl geldiğine dikkat edin.

        const { datacode, name, lat, lng, def, type_id, village_id,company_code,manager_id } = req.body;

        // Gerekli alanlar doldurulmuş mu kontrol et
        if (!datacode || !name || !lat || !lng || !type_id || !village_id || !company_code || !manager_id) {
            return res.status(400).json({ message: 'Lütfen tüm gerekli alanları doldurun.' });
        }

        // Sensörün daha önce eklenip eklenmediğini kontrol et
        const existingSensor = await Sensors.findOne({ where: { datacode } });
        if (existingSensor) {
            return res.status(400).json({ error: "Bu sensör zaten kayıtlı." });
         }

        // Yeni sensör oluştur
        const newSensor = await Sensors.create({
            datacode,
            name,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            def,
            type: parseInt(type_id),  // type_id'nin doğru şekilde kullanımı
            company_code: company_code,
            village_id: parseInt(village_id),
        });

        const sensorId = newSensor.id
        console.log(newSensor.id);
        console.log(manager_id);
        const ownerResponse = await addOwner(manager_id, sensorId);

        // Başarılı yanıt döndürme
        res.status(201).json({
            message: 'Sensör başarıyla eklendi.',
            sensor: newSensor,
            owner: ownerResponse,
        });

    } catch (error) {
        console.error('Sensör eklenirken hata:', error);
        res.status(500).json({ message: 'Bir hata oluştu. Lütfen tekrar deneyin.' });
    }
};

const addOwner = async (managerId, sensorId) => {
    try {

        console.log(`Manager ${managerId} ile Sensor ${sensorId} bağlanıyor.`);

        // SensorOwner kaydı oluşturma
        const newOwner = await SensorOwner.create({
            sensor_owner:parseInt(managerId),
            sensor_id:parseInt(sensorId),
        });

        console.log('Yeni owner kaydedildi:', newOwner);

        return { success: true, message: 'Owner başarıyla eklendi', owner: newOwner };
    } catch (error) {
        console.error('Owner ekleme hatası:', error);
        return { success: false, message: 'Owner ekleme sırasında bir hata oluştu.' };
    }
};

const addTypes = async (req,res) =>{

    try{
        const user = req.user;
        if( (user.role==="personal" || user.role==="manager") || !user){
            return res.status(400).json({ message: 'Bu işlemi yapmaya yetkiniz yoktur. Lütfen yetkili birisine ulaşınız' });
        } //type eklemeyi sadece admin

        const {type} = req.body;

        const existingType = await Type.findOne({ where: { type } });
        if (existingType) {
            return res.status(400).json({ error: "Bu tip zaten kayıtlı." });
        }

        const newType = await Type.create({
            type
            }
        );

        res.status(201).json("Tip eklendi"+newType);
    }catch (err){
        console.log("Kayıt hatası:", err);
        res.status(500).json({error: "Ekleme sırasında bir hata oluştu. "});
    }
};

const getTypes = async (req, res) => {
    try {
        const types = await Type.findAll();
        if (!Array.isArray(types)) {
            return res.status(500).json({ message: 'Veri düzgün alınamadı.' });
        }
        res.status(200).json(types);
    } catch (error) {
        console.error('Tipler alınırken hata:', error);
        res.status(500).json({ message: 'Tipleri alırken bir hata oluştu.' });
    }
};

const getUserSensors = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        let data;

        if (role === "administrator") {
            data = await getAdminSensors(); // Admin tüm verileri görür
        } else if (role === "manager") {
            data = await getManagerSensors(userId); // Manager kendi sensörlerini görür
        } else if (role === "personal") {
            data = await getUserOwnedSensors(userId); // Personal kendi sensörlerini görür
        } else {
            return res.status(403).json({ message: "Bu role erişim izni yok." });
        }

        res.status(200).json(data); // Verileri JSON formatında döndür
    } catch (error) {
        console.error('Sensörleri alırken hata:', error);
        res.status(500).json({ message: 'Sensörleri alırken bir hata oluştu.' });
    }
};

// admin sensör görüntüleme
const getAdminSensors = async () => {

    const allCompanies = await Companies.findAll({
        attributes: ['code', 'name'],
    });

    const managers = await Users.findAll({
        where: { role: "manager" },
        attributes: ['companyCode', 'name', 'lastname', 'email', 'phone', 'role'],
    });

    const personals = await Users.findAll({
        where: { role: "personal" },
        attributes: ['companyCode', 'name', 'lastname', 'email', 'phone', 'role'],
    });

    const sensors = await getAllSensors();

    return { allCompanies, managers, personals, sensors }; //şirketler managerler personeller hepsi burada olur
};

const getManagerSensors = async (userId) => {
    const manager = await Users.findOne({
        where: { id: userId },
        attributes: ['id', 'name', 'companyCode', 'role'],
    });

    if (!manager) throw new Error('Manager bulunamadı.');

    const sensorIds = await getSensorIdsByOwner(manager.id);
    const sensors = await getSensorsByIds(sensorIds);

    return sensors;
};

const getUserOwnedSensors = async (userId) => {
    try {
        const sensorIds = await getSensorIdsByOwner(userId);

        if (sensorIds.length === 0) {
            return []; // Hiç sensör yoksa boş döndür
        }

        const sensors = await getSensorsByIds(sensorIds);
        return sensors;
    } catch (error) {
        console.error('Sensörleri alırken hata:', error);
        throw new Error('Sensörleri alırken bir hata oluştu.');
    }
};


module.exports = { addTypes, addSensors, getTypes,getUserSensors  };

