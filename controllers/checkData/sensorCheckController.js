const SensorCheck = require('../../models/checkData/sensorCheck');

// Checkbox verilerini ekleme ve güncelleme fonksiyonu
const addCheckBoxChancehing = async (req, res) => {
    const { name, sagUstNem, sagUstSicaklik, sagAltNem, sagAltSicaklik, solAltNem, solAltSicaklik, yagis, mesafe, turkcell, vodafone, turkTelekom } = req.body;

    try {
        let sensor = await SensorCheck.findOne({ where: { name } });

        if (sensor) {
            await sensor.update({
                sagUstNem,
                sagUstSicaklik,
                sagAltNem,
                sagAltSicaklik,
                solAltNem,
                solAltSicaklik,
                yagis,
                mesafe,
                turkcell,
                vodafone,
                turkTelekom
            });
        } else {
            sensor = await SensorCheck.create({
                name,
                sagUstNem,
                sagUstSicaklik,
                sagAltNem,
                sagAltSicaklik,
                solAltNem,
                solAltSicaklik,
                yagis,
                mesafe,
                turkcell,
                vodafone,
                turkTelekom
            });
        }

        res.status(200).json({ message: "Veri başarıyla kaydedildi veya güncellendi.", data: sensor });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Veri kaydedilirken bir hata oluştu." });
    }
};

// Tüm sensör verilerini getirme fonksiyonu
const getAllSensors = async (req, res) => {
    try {
        const sensors = await SensorCheck.findAll({
            attributes: ['name', 'lat', 'lng', 'tur']
        });
        res.status(200).json(sensors);
    } catch (error) {
        console.error('Sensör verileri çekilirken hata:', error);
        res.status(500).json({ message: 'Veri alınamadı.' });
    }
};

// Belirli bir sensör verisini isme göre getirme fonksiyonu
const getSensorByName = async (req, res) => {
    const { name } = req.params;

    try {
        const sensor = await SensorCheck.findOne({
            where: { name }
        });
        if (sensor) {
            res.json(sensor);
        } else {
            res.status(404).json({ message: 'Sensör bulunamadı.' });
        }
    } catch (error) {
        console.error('Sensör verisi çekilirken hata:', error);
        res.status(500).json({ message: 'Bir hata oluştu.' });
    }
};


module.exports = { addCheckBoxChancehing, getAllSensors, getSensorByName };