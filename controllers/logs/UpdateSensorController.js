const Sensors = require('../../models/sensors/Sensors');
const SensorLogs = require('../../models/logging/sensorsLog');

// Sensör güncelleme fonksiyonu
async function updateSensor(req, res) {
    const sensorId = req.params.id; // Güncellenecek sensörün ID'si
    const updatedData = req.body; // Yeni veriler

    try {
        // Sensörü bul
        const sensor = await Sensors.findByPk(sensorId);
        if (!sensor) {
            return res.status(404).json({ message: 'Sensör bulunamadı.' });
        }

        // Eski veriyi al
        const oldData = { ...sensor.dataValues };

        // Sensör verilerini güncelle
        await sensor.update(updatedData);

        // Log kaydet
        await SensorLogs.create({
            sensorId,
            oldData: JSON.stringify(oldData), // Eski verileri JSON formatına çevir
            newData: JSON.stringify(updatedData), // Yeni verileri JSON formatına çevir
            action: 'update', // İşlem türü
        });

        // Başarılı yanıt
        res.status(200).json({
            message: 'Sensör başarıyla güncellendi ve log kaydedildi.',
            sensor, // Güncellenmiş sensör bilgileri
        });
    } catch (error) {
        console.error('Sensör güncellenirken hata oluştu:', error);
        res.status(500).json({ message: 'Sensör güncellenirken bir hata oluştu.', error });
    }
}

//Gelen ip'ye göre otomatik aktif pasiflik değişimi
async function isActiveForIP(req, res) {
    const sensorId = req.params.id;
    const isActive = req.params.isActive === 'true';
    console.log(isActive);
    try {
        if (!sensorId) {
            return res.status(400).json({ message: "Sensör id bulunamadı (isactiveFORİP)" });
        }

        const sensor = await Sensors.findByPk(sensorId);
        if (!sensor) {
            return res.status(404).json({ message: "Sensör bulunamadı." });
        }

        if (sensor.isActive === isActive) {
            return res.status(200).json({
                message: "Değiştirme işlemi olmadı.",
                sensor,
            });
        }

        await sensor.update({ isActive });

        return res.status(200).json({
            message: "Sensör durumu başarıyla güncellendi.",
            sensor,
        });

    } catch (err) {
        console.error("Hata:", err);
        res.status(500).json({
            message: "Sensör durumu güncellenirken bir hata oluştu.",
            error: err.message,
        });
    }
}



module.exports = {
    updateSensor,
    isActiveForIP,
};
