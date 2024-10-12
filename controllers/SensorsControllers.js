const Type = require("../models/sensors/SensorTypes");
const Sensors = require('../models/sensors/Sensors'); // Sensors modelini içe aktar

const addSensors = async (req, res) => {
    try {
        const user = req.user;

        // Kullanıcı yetkisini kontrol et
        if (user.role === "personal" || !user) {
            return res.status(400).json({
                message: 'Bu işlemi yapmaya yetkiniz yoktur. Lütfen yetkili birisine ulaşınız.',
            });
        }

        // Gelen veriyi kontrol et
        console.log('Gelen Veri:', req.body); // Burada datanın nasıl geldiğine dikkat edin.

        const { datacode, name, lat, lng, def, type_id, village_id } = req.body;

        // Gerekli alanlar doldurulmuş mu kontrol et
        if (!datacode || !name || !lat || !lng || !type_id || !village_id) {
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
            company_code: user.company_code || "administrator",
            creator_id: user.id,
            village_id: parseInt(village_id),
        });

        res.status(201).json({
            message: 'Sensör başarıyla eklendi.',
            sensor: newSensor,
        });

    } catch (error) {
        console.error('Sensör eklenirken hata:', error);
        res.status(500).json({ message: 'Bir hata oluştu. Lütfen tekrar deneyin.' });
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
        res.status(200).json(types);
    } catch (error) {
        console.error('Tipler alınırken hata:', error);
        res.status(500).json({ message: 'Tipleri alırken bir hata oluştu.' });
    }
};

module.exports = {addTypes,addSensors,getTypes};