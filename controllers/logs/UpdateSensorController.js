const Sensors = require('../../models/sensors/Sensors');
const SensorLogs = require('../../models/logging/sensorsLog');
const SensorsOwner = require('../../models/sensors/sensorOwner');
const UndefinedSensor = require('../../models/sensors/Undefined_sensors');
const SensorTypes = require('../../models/sensors/SensorTypes');
const {Op} = require("sequelize");
const Users = require('../../models/users/User');
const Sequelize = require('sequelize');
const sequelize = require('../../config/database'); // Veritabanı bağlantısı
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

const handleSensorOperations = async (req, res) => {
    const { userId, role, companyCode } = req.body;
    console.log("user ıd ",userId,role,companyCode);
    try {
        if (!userId || !role || !companyCode) {
            return res.status(400).json({ message: "Eksik parametreler. userId, role ve companyCode gerekli." });
        }

        if (role === "manager") {
            const relatedSensors = await SensorsOwner.findAll({
                where: { sensor_owner: userId },
            });

            for (const sensor of relatedSensors) {
                // Manuel SQL sorgusu ile başka manager olup olmadığını kontrol et
                const otherManagersWithSameSensor = await sequelize.query(
                    `
                    SELECT so.*
                    FROM sensors_owners so
                    INNER JOIN users u ON so.sensor_owner = u.id
                    WHERE so.sensor_id = :sensorId
                      AND so.sensor_owner != :userId
                      AND u.role = 'manager'
                      AND u.companyCode = :companyCode
                    LIMIT 1
                    `,
                    {
                        type: sequelize.QueryTypes.SELECT,
                        replacements: {
                            sensorId: sensor.sensor_id,
                            userId: userId,
                            companyCode: companyCode,
                        },
                    }
                );

                if (otherManagersWithSameSensor.length === 0) {
                    // Eğer başka bir manager ile bağlantılı değilse, sensörü UndefinedSensor tablosuna aktar
                    await UndefinedSensor.create({
                        originalSensorId: sensor.sensor_id,
                        deactivatedAt: new Date(),
                    });
                }

                // Gelen manager için sensör kaydını sadece SensorsOwner tablosundan sil
                await SensorsOwner.destroy({
                    where: {
                        sensor_id: sensor.sensor_id,
                        sensor_owner: userId,
                    },
                });

                // Sensör loglarını kaydet
                await SensorLogs.create({
                    sensorId: sensor.sensor_id,
                    oldData: JSON.stringify({ sensorId: sensor.sensor_id, owner: userId }),
                    newData: JSON.stringify({ owner: otherManagersWithSameSensor.length > 0 ? otherManagersWithSameSensor[0].sensor_owner : null }),
                    action: "unlink_sensor_manager",
                    timestamp: new Date(),
                });
            }
        }
        else if (role === "personal") {
            const relatedSensors = await SensorsOwner.findAll({
                where: { sensor_owner: userId },
            });

            for (const sensor of relatedSensors) {
                await SensorsOwner.destroy({
                    where: { sensor_id: sensor.sensor_id,
                            sensor_owner:userId,
                    },
                });

                await SensorLogs.create({
                    sensorId: sensor.sensor_id,
                    oldData: JSON.stringify({ sensorId: sensor.sensor_id, owner: userId }),
                    newData: JSON.stringify({ owner: null }),
                    action: "unlink_sensor_personal",
                    timestamp: new Date(),
                });
            }
        }

        res.status(200).json({ message: "Sensör işlemleri başarıyla tamamlandı." });
    } catch (error) {
        console.error("Sensör işlemlerinde hata:", error);
        res.status(500).json({ message: "Sensör işlemleri sırasında bir hata oluştu." });
    }
};

const fetchUndefinedSensors = async (req, res) => {
    const { companyCode } = req.query;

    try {
        // UndefinedSensor tablosunu sorgula
        const undefinedSensors = await UndefinedSensor.findAll();

        if (!undefinedSensors || undefinedSensors.length === 0) {
            return res.status(200).json({
                message: companyCode
                    ? 'Belirtilen şirket koduna ait tanımsız sensör bulunmamaktadır.'
                    : 'Tanımsız sensör bulunmamaktadır.',
                data: [], // Boş bir liste döndür
            });
        }

        const sensorIds = undefinedSensors.map((us) => us.originalSensorId);
        console.log("Sorgulanan sensorIds:", sensorIds);

        // Sensors tablosundan sensörleri al
        const sensors = await Sensors.findAll({
            where: {
                id: sensorIds,
                ...(companyCode && { company_code: companyCode }), // Şirket kodu varsa filtre uygula
            },
            attributes: ['id', 'name', 'type', 'company_code'],
        });

        // SensorsTypesTables tablosundan tüm tipleri al
        const sensorTypes = await SensorTypes.findAll({
            attributes: ['id', 'type'],
        });

        // UndefinedSensor ve Sensors tablosunu manuel birleştir
        const result = undefinedSensors.map((undefinedSensor) => {
            const sensor = sensors.find((s) => s.id === undefinedSensor.originalSensorId);
            if (!sensor) {
                console.warn(`Sensör bilgisi bulunamadı: ID ${undefinedSensor.originalSensorId}`);
                return null; // Bu sensörü atla
            }

            // SensorsTypesTables tablosundan sensör tipini bul
            const sensorType = sensorTypes.find((st) => st.id === sensor.type);

            return {
                id: undefinedSensor.id,
                originalSensorId: undefinedSensor.originalSensorId,
                deactivatedAt: undefinedSensor.deactivatedAt,
                sensorName: sensor.name,
                sensorType: sensorType ? sensorType.type : 'Bilinmiyor', // Tip bilgisi yoksa 'Bilinmiyor'
                companyCode: sensor.company_code,
            };
        }).filter(Boolean); // Null olanları filtrele

        if (result.length === 0) {
            return res.status(200).json({
                message: companyCode
                    ? 'Belirtilen şirket koduna ait tanımsız sensör bulunmamaktadır.'
                    : 'Tanımsız sensör bulunmamaktadır.',
                data: [], // Boş bir liste döndür
            });
        }

        console.log("Sonuç:", result);
        res.status(200).json({
            message: 'Tanımsız sensörler başarıyla getirildi.',
            data: result,
        });
    } catch (error) {
        console.error('Tanımsız sensörler alınırken hata:', error.message);
        res.status(500).json({ message: 'Tanımsız sensörler alınırken bir hata oluştu.', error: error.message });
    }
};

const assignSensorsToManager = async (req, res) => {
    const { managerId, sensorIds } = req.body;  // Gelen body'den managerId ve sensorIds

    if (!managerId || !Array.isArray(sensorIds) || sensorIds.length === 0) {
        return res.status(400).json({ message: "Eksik veya geçersiz parametreler." });
    }

    try {
        const logs = []; // Log kayıtlarını toplamak için bir dizi

        // Gelen sensör ID'leriyle işlem yap
        for (let sensorId of sensorIds) {
            // UndefinedSensor tablosunda sensörü bul
            const undefinedSensor = await UndefinedSensor.findOne({
                where: { id: sensorId }, // Gelen sensör ID'yi arıyoruz
                attributes: ['id', 'originalSensorId'], // Eski sensör bilgileri için gerekli alanlar
            });

            if (!undefinedSensor) {
                console.log(`Sensor ID ${sensorId} UndefinedSensor tablosunda bulunamadı.`);
                continue;
            }

            // Eski sensör bilgileri (log için)
            const oldData = JSON.stringify({
                originalSensorId: undefinedSensor.originalSensorId,
                previousOwner: 'Undefined',
            });

            // Sensörü `sensor_owners` tablosuna ekle
            await SensorsOwner.create({
                sensor_id: undefinedSensor.originalSensorId,  // originalSensorId'yi kullanıyoruz
                sensor_owner: managerId,  // Yeni atanacak yönetici
            });

            // UndefinedSensor tablosundan sil
            await UndefinedSensor.destroy({
                where: { id: undefinedSensor.id }, // Tanımsız sensörü tablodan sil
            });

            // Yeni sensör bilgileri (log için)
            const newData = JSON.stringify({
                originalSensorId: undefinedSensor.originalSensorId,
                newOwner: managerId,
            });

            // Log kaydını diziye ekle
            logs.push({
                sensorId: undefinedSensor.originalSensorId,
                oldData,
                newData,
                action: 'assign',
                timestamp: new Date(),
            });

            console.log(`Sensor ID ${sensorId} başarıyla atanarak UndefinedSensor tablosundan silindi.`);
        }

        // Tüm logları toplu olarak SensorLogs tablosuna ekle
        if (logs.length > 0) {
            await SensorLogs.bulkCreate(logs);
        }

        res.status(200).json({ message: "Sensörler başarıyla atandı ve loglandı." });
    } catch (error) {
        console.error("Atama sırasında hata:", error);
        res.status(500).json({ message: "Sensörler atanırken bir hata oluştu.", error: error.message });
    }
};

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

const assignSensorsToUser = async (req, res) => {
    const { sensorIds, userIds, role } = req.body;

    // Validation: Gelen veriler kontrol edilir
    if (!sensorIds || !Array.isArray(sensorIds) || sensorIds.length === 0) {
        return res.status(400).json({ message: 'Lütfen en az bir sensör seçin!' });
    }
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: 'Lütfen en az bir kullanıcı seçin!' });
    }
    if (!role || (role !== 'manager' && role !== 'personal')) {
        return res.status(400).json({ message: 'Geçersiz rol!' });
    }

    try {
        // Mevcut atamaları kontrol et
        const existingAssignments = await SensorsOwner.findAll({
            where: {
                sensor_id: sensorIds,
                sensor_owner: userIds,
            },
        });

        // Mevcut ilişkileri bir Set olarak al
        const existingPairs = new Set(
            existingAssignments.map(
                (assignment) => `${assignment.sensor_id}-${assignment.sensor_owner}-${role}` //assigment.role 'yi sadece role olarak değiştirdim.
            )
        );

        // Sadece yeni atamaları ekle
        const assignmentsToAdd = [];
        const logsToAdd = []; // Logları tutacak dizi
        sensorIds.forEach((sensorId) => {
            userIds.forEach((userId) => {
                const pairKey = `${sensorId}-${userId}-${role}`;
                if (!existingPairs.has(pairKey)) {
                    assignmentsToAdd.push({
                        sensor_owner: userId,
                        sensor_id: sensorId,
                        role: role,
                    });

                    // Log için ekle
                    logsToAdd.push({
                        sensorId,
                        oldData: JSON.stringify({ sensor_owner: null, role: null }), // Eski veri
                        newData: JSON.stringify({ sensor_owner: userId, role: role }), // Yeni veri
                        action: `${role}_sensor_tanımlama`,
                    });
                }
            });
        });

        if (assignmentsToAdd.length > 0) {
            // Yeni ilişkileri toplu olarak ekle
            await SensorsOwner.bulkCreate(assignmentsToAdd);
        }

        // Logları kaydet
        if (logsToAdd.length > 0) {
            await SensorLogs.bulkCreate(logsToAdd);
        }

        res.status(200).json({
            message:
                assignmentsToAdd.length > 0
                    ? `Sensörler başarıyla ${role}lara atanmıştır!`
                    : 'Seçilen sensörler zaten atanmıştı.', //Tüm yazısını İlgili olarak değiştirdim
        });
    } catch (error) {
        console.error('Error assigning sensors:', error);
        res.status(500).json({ message: 'Sensörleri atarken bir hata oluştu.' });
    }
};


module.exports = {
    updateSensor,handleSensorOperations,fetchUndefinedSensors,assignSensorsToManager,
    isActiveForIP,assignSensorsToUser,
};
