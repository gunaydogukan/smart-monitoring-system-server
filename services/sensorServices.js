const Sensors = require('../models/sensors/Sensors');
const SensorOwner = require('../models/sensors/sensorOwner');

// Tüm sensörleri alma
const getAllSensors = async () => {
    return await Sensors.findAll();
};

// Belirli ID'lere sahip sensörleri alma
const getSensorsByIds = async (sensorIds) => {
    return await Sensors.findAll({
        where: { id: sensorIds },
    });
};

// Kullanıcıya ait sensör ID'lerini alma
const getSensorIdsByOwner = async (userId) => {
    const ownedSensors = await SensorOwner.findAll({
        where: { sensor_owner: userId },
        attributes: ['sensor_id'], // Sadece sensor_id alanını al
    });

    return ownedSensors.map(sensor => sensor.sensor_id); // ID'leri liste olarak döndür
};

module.exports = {
    getAllSensors,
    getSensorsByIds,
    getSensorIdsByOwner,
};