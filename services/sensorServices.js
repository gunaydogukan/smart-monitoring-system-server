const Sensors = require('../models/sensors/Sensors');
const SensorOwner = require('../models/sensors/sensorOwner');
const Type = require("../models/sensors/SensorTypes");
const SensorLogs = require('../models/logging/sensorsLog');
const UserLogs = require('../models/logging/userLog');

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
const getSensorLogToAction = async (userId,role,action) => {
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

const getSensorLog = async (userId,role) => {
    try {
        // `action` değeri kontrolü
        if (!userId || (role==="manager"||role=="personal")) {
            throw new Error("Yetkisiz erişim");
        }

        let sensors;
        let sensorIds;
        if(role==="administrator"){
            sensors = (await getAllSensors()).sensors;
            sensorIds = sensors.map(sensor => sensor.id);
        }

        // Veritabanından `action` değerine göre logları getir
        const logs = await SensorLogs.findAll({
            where: {
                sensorId: sensorIds
            },
            order: [['timestamp', 'DESC']], // En son loglar önce gelsin
        });

        // Log bulunamadığında
        if (logs.length === 0) {
            throw new Error("Belirtilen 'action' değeriyle eşleşen log bulunamadı.");
        }

        const logsWithSensorsName = (logs, sensors) => {
            // logs içindeki sensorId'leri sensors listesindeki name ile değiştiriyoruz
            return logs.map(log => {
                const sensor = sensors.find(sensor => sensor.id === log.dataValues.sensorId);
                if (sensor) {
                    return {
                        ...log.dataValues, // Orijinal log verilerini kopyala
                        sensorName: sensor.name, // sensorId yerine name ekle
                    };
                } else {
                    return log.dataValues; // Eşleşme olmazsa olduğu gibi bırak
                }
            });
        };

        const processedLogs = logsWithSensorsName(logs, sensors);

        const groupedLogs = processedLogs.reduce(
            (acc, log) => {
                const action = log.action;

                // Eğer details kısmında action yoksa başlat
                if (!acc.details[action]) {
                    acc.details[action] = [];
                }

                // Log'u details kısmına ekle
                acc.details[action].push(log);

                // Summary kısmında action sayısını artır
                acc.summary[action] = (acc.summary[action] || 0) + 1;

                return acc;
            },
            { summary: {}, details: {} }
        );

        // Logları başarıyla döndür
        return {
            summary: groupedLogs.summary,
            details: groupedLogs.details,
        };
    } catch (err) {
        console.error("Hata:", err);
        return {
            error: err.message,
        };
    }
};

const getUserLog = async (userId, role) => {
    try {
        // Role kontrolü
        if (!userId || (role === "manager" || role === "personal")) {
            throw new Error("Yetkisiz erişim");
        }

        // Logları veritabanından çekme
        const logs = await UserLogs.findAll({
            order: [['timestamp', 'DESC']], // Logları zamana göre sıralıyoruz
        });

        if (logs.length === 0) {
            throw new Error("Kullanıcı logları bulunamadı.");
        }

        // Logları gruplama ve özet oluşturma
        const groupedLogs = logs.reduce(
            (acc, log) => {
                const action = log.dataValues.action;

                if (!acc.logs[action]) {
                    acc.logs[action] = {
                        total: 0,
                        logs: [],
                    };
                }

                // Farklılıkları hesapla
                const differences = getDifferences(log.dataValues.oldData, log.dataValues.newData);

                // Gereksiz alanları çıkar ve sadeleştir
                const { id, userId, action: logAction, timestamp } = log.dataValues;

                acc.logs[action].logs.push({
                    id,
                    userId,
                    action: logAction,
                    timestamp,
                    differences,
                });
                acc.logs[action].total += 1;

                // Özet güncelle
                acc.summary[action] = (acc.summary[action] || 0) + 1;

                return acc;
            },
            { logs: {}, summary: {} }
        );

        // Sonuçları döndür
        return {
            groupedLogs,
        };
    } catch (error) {
        console.error("Hata:", error);
        return {
            error: error.message,
        };
    }
};

// Farklılıkları bulmak için ayrı bir metot
const getDifferences = (oldData, newData) => {
    const oldObj = JSON.parse(oldData);
    const newObj = JSON.parse(newData);

    const differences = {};
    // `user` nesnesini ekle
    differences.user = {
        name: newObj.name || null,
        lastname: newObj.lastname || null,
    };

    for (const key in newObj) {
        // `updatedAt` alanını hariç tut
        if (key === "updatedAt") {
            continue;
        }

        if (oldObj[key] !== newObj[key]) {
            differences[key] = { oldValue: oldObj[key], newValue: newObj[key] };
        }
    }

    return differences;
};


module.exports = {
    getAllSensors,
    getSensorsByIds,
    getSensorIdsByOwner,
    getSensorByOwner,
    getTypes,
    getSensorLog,
    getSensorLogToAction,
    getUserLog
};