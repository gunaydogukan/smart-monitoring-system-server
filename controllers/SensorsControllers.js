const Type = require("../models/sensors/SensorTypes");
const Sensors = require('../models/sensors/Sensors'); // Sensors modelini içe aktar
const SensorOwner = require('../models/sensors/sensorOwner');

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

        const ownerResponse =addOwner(manager_id,sensorId); //owner table'ına manager ve sensör gönderildi

        res.status(201).json({
            message: 'Sensör başarıyla eklendi.',
            sensor: newSensor,
            owner:ownerResponse,
        });

    } catch (error) {
        console.error('Sensör eklenirken hata:', error);
        res.status(500).json({ message: 'Bir hata oluştu. Lütfen tekrar deneyin.' });
    }
};

const addOwner =async (managerId, sensorId) => {
    // Fonksiyon içinde yapılacak işlemler
    console.log(`Manager ${managerId} ile Sensor ${sensorId} bağlanıyor.`);

    const newOwner = await SensorOwner.create({
        managerId,
        sensorId
    });

    return "owner başarıyla eklendi";

    // Burada gerekli işlemleri yapabilirsiniz
    // Örneğin, backend'e bir POST isteği ile owner ekleme
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
        res.status(200).json(types);
    } catch (error) {
        console.error('Tipler alınırken hata:', error);
        res.status(500).json({ message: 'Tipleri alırken bir hata oluştu.' });
    }
};



// Kullanıcıya ait sensörleri getirir
const getUserSensors = async (req, res) => {
    try {
        const userId = req.user.id; // Middleware'den oturum açan kullanıcının id'si

        // Kullanıcının sahip olduğu sensörlerin id'lerini bulalım
        const ownedSensors = await SensorOwner.findAll({
            where: { sensor_owner: userId },
            attributes: ['sensor_id'], // Sadece sensor_id alanını alıyoruz
        });

        const sensorIds = ownedSensors.map(sensor => sensor.sensor_id); // Sensor ID'leri listeye çeviriyoruz

        // Sensörlerin detaylarını Sensors tablosundan alalım
        const sensors = await Sensors.findAll({
            where: { id: sensorIds },
        });

        res.status(200).json(sensors); // Sensörleri döndürüyoruz
    } catch (error) {
        console.error('Kullanıcı sensörlerini alırken hata:', error);
        res.status(500).json({ message: 'Sensörleri alırken bir hata oluştu.' });
    }
};

module.exports = { addTypes, addSensors, getTypes, getUserSensors };
