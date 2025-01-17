const Sensors = require('../models/sensors/Sensors');
const SensorOwner = require('../models/sensors/sensorOwner');
const Type = require("../models/sensors/SensorTypes");

// Tüm sensörleri alma
const getAllSensors = async () => {
    // bu metotu sadece admin çağırabilir
    try {
        // Sensors tablosundan tüm sensörleri getir
        const sensors = await Sensors.findAll();

        // SensorOwner tablosundan sahiplik bilgilerini getir
        const sensorOwners = await SensorOwner.findAll({
            attributes: ['sensor_owner', 'sensor_id'],
        });

        // Verileri ayrı ayrı döndürüyoruz
        return { sensors, sensorOwners };
    } catch (error) {
        console.error('Sensör ve sahiplik bilgilerini alırken hata:', error);
        throw new Error('Veri alımı sırasında bir hata oluştu.');
    }
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
        attributes: ['sensor_owner','sensor_id'], //
    });

    return ownedSensors.map(sensor => sensor.sensor_id); // ID'leri liste olarak döndür
};

const getSensorByOwner= async (userId,sensorId) => {
    const ownedSensors = await SensorOwner.findAll({
        where:{sensor_owner: userId, sensor_id:sensorId},
        attributes: ['sensor_owner', 'sensor_id'],
    });

    return ownedSensors;
}

const getTypes = async () => {
    try {
        const types = await Type.findAll();
        return types;
    } catch (error) {
        console.error('Tipler alınırken hata:', error);
    }
};


module.exports = {
    getAllSensors,
    getSensorsByIds,
    getSensorIdsByOwner,
    getSensorByOwner,
    getTypes
};