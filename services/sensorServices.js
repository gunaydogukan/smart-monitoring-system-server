const Sensors = require('../models/sensors/Sensors');
const SensorOwner = require('../models/sensors/sensorOwner');
const Type = require("../models/sensors/SensorTypes");
const SensorLogs = require('../models/logging/sensorsLog');

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
    try {
        // Gelen userId'nin geçerli olup olmadığını kontrol et
        if (!userId) {
            throw new Error('User ID is required');
        }

        // Veritabanından ilgili sensörleri al
        const ownedSensors = await SensorOwner.findAll({
            where: { sensor_owner: userId },
            attributes: ['sensor_id'], // Gereksiz attribute'leri çıkardık
        });
        // Eğer sonuç boşsa uyarı döndür
        if (ownedSensors.length === 0) {
            console.warn(`No sensors found for user ID: ${userId}`);
            return [];
        }
        // ID'leri bir liste olarak döndür
        return ownedSensors.map(sensor => sensor.sensor_id);

    } catch (error) {
        console.error('Error fetching sensor IDs:', error.message);
        throw error; // Hatanın yukarıya fırlatılması
    }
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

//actiona göre sensör logları getirilir.
//getirilen sensör loglarında kullancılıarın sahip olduğu sensör kontrolü yapılmalı.?
const getSensorLog = async (userId,role,action) => {
    try {
        // `action` değeri kontrolü
        if (!action || !userId) {
            throw new Error("Lütfen geçerli bir 'action' değeri sağlayın.");
        }

        let sensorIds;
        if(role==="administrator"){
            const sensors = (await getAllSensors()).sensors;
            sensorIds = sensors.map(sensor => sensor.id);
        }else{
            sensorIds= getSensorIdsByOwner(userId);
        }

        // Veritabanından `action` değerine göre logları getir
        const logs = await SensorLogs.findAll({
            where: {
                action: action,
                sensorId: sensorIds
            },
            order: [['timestamp', 'DESC']], // En son loglar önce gelsin
        });

        // Log bulunamadığında
        if (logs.length === 0) {
            throw new Error("Belirtilen 'action' değeriyle eşleşen log bulunamadı.");
        }

        // Logları başarıyla döndür
        return {
            success: true,
            message: `Action '${action}' için loglar başarıyla getirildi.`,
            logs,
        };
    } catch (err) {
        console.error("Hata:", err);
        return {
            success: false,
            error: err.message,
        };
    }
};

module.exports = {
    getAllSensors,
    getSensorsByIds,
    getSensorIdsByOwner,
    getSensorByOwner,
    getTypes,
    getSensorLog
};