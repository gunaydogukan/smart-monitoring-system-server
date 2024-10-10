const Type = require("../models/sensors/SensorTypes");
const Sensors = require('../models/sensors/Sensors'); // Sensors modelini içe aktar

const addSensors = async (req, res) => {

    try {

        if(req.user.role==="personal" || !req.user){
            return res.status(400).json({ message: 'Bu işlemi yapmaya yetkiniz yoktur. Lütfen yetkili birisine ulaşınız' });
        } //sensör eklemeyi sadece admin ve manager yapabilir

        const { datacode, name, lat, lng, def, type, company_code, creator_id, village_id } = req.body;

        // Gerekli alanların doğrulanması
        if (!datacode || !name || !lat || !lng || !type || !company_code || !creator_id || !village_id) {
            return res.status(400).json({ message: 'Lütfen tüm gerekli alanları doldurun.' });
        }

        const existingSensor = await Sensors.findOne({ where: { datacode } });
        if (existingSensor) {
            return res.status(400).json({ error: "Bu sensör zaten kayıtlı." });
        }

        const newSensor = await Sensors.create({
            datacode,
            name,
            lat,
            lng,
            def,
            type,
            company_code,
            creator_id,
            village_id
        });

        res.status(201).json({
            message: 'Sensör başarıyla eklendi.',
            sensor: newSensor
        });
    } catch (error) {
        console.error('Sensör eklenirken hata:', error);
        res.status(500).json({ message: 'Bir hata oluştu. Lütfen tekrar deneyin.' });
    }
};

const addTypes = async (req,res) =>{

    try{

        if( (req.user.role==="personal" || req.user.role==="manager") || !req.user){
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

module.exports = {addTypes,addSensors};