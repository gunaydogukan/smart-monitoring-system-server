const Type = require("../models/sensors/SensorTypes");
const Sensors = require('../models/sensors/Sensors'); // Sensors modelini içe aktar
const SensorOwner = require('../models/sensors/sensorOwner');
const Companies = require('../models/users/Companies');
const Users = require('../models/users/User');
const { SensorData } = require("../models/sensors/SensorsData"); //sensor data table'a eklemek için
const IPLogger = require("../models/logs/IPLog");  //sensör eklendiğinde sensor dataCodu ıpLog table'ına atılır ve ilk ip null olarak gider
const { getAllSensors,getSensorIdsByOwner,getSensorsByIds,getSensorByOwner} = require('../services/sensorServices');

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

        let newSensor;
        // Sensörün daha önce eklenip eklenmediğini kontrol etme alanı
        const existingSensor = await Sensors.findOne({ where: { datacode } });
        if (existingSensor) {
            newSensor=existingSensor;
         }else{
            // Yeni sensör oluştur
            newSensor = await Sensors.create({
                datacode,
                name,
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                def,
                type: parseInt(type_id),  // type_id'nin doğru şekilde kullanımı
                company_code: company_code,
                village_id: parseInt(village_id),
            });
        }

        //sensör verisi ekleme alanı
        //const newSensorData = await SensorData(newSensor);
       // console.log(newSensorData);

        //sensör sahibi ekleme alanı
        const sensorId = newSensor.id
        const ownerResponse = await addOwner(manager_id, sensorId);

        // IP_loggers tablosuna veri ekleme alanı
        const newIPLog = await IPLogger.create({
            datacode: datacode,
            IP_Adresses: null,        // Başlangıçta IP adresi null olacak
        });
        console.log('Yeni IP Log: ', newIPLog);

        // Başarılı yanıt döndürme
        res.status(201).json({
            message: 'Sensör başarıyla eklendi.',
            sensor: newSensor,
            owner: ownerResponse,
        });

    } catch (error) {
        console.error('Sensör eklenirken hata:', error);
        res.status(500).json({ message: 'Bir hata oluştu. Lütfen tekrar deneyin.' });
    }
};

const addOwner = async (managerId, sensorId) => {
    try {

        console.log(`Manager ${managerId} ile Sensor ${sensorId} bağlanıyor.`);

        const existingOwner = await SensorOwner.findOne({
            where: {
                sensor_owner: parseInt(managerId),
                sensor_id: parseInt(sensorId),
            }
        });

        if(existingOwner){
            return { success: true, message: 'Owner zaten bu sensöre sahip.', owner: existingOwner };
        }

        // SensorOwner kaydı oluşturma
        const newOwner = await SensorOwner.create({
            sensor_owner:parseInt(managerId),
            sensor_id:parseInt(sensorId),
        });

        console.log('Yeni owner kaydedildi:', newOwner);

        return { success: true, message: 'Owner başarıyla eklendi', owner: newOwner };
    } catch (error) {
        console.error('Owner ekleme hatası:', error);
        return { success: false, message: 'Owner ekleme sırasında bir hata oluştu.' };
    }
};

//Burada yeni sensör tipi ekleme işlemi yapılır
const addNewType = async (req,res) =>{
    try{
        const user = req.user;
        console.log(user);
        if( (user.role==="personal" || user.role==="manager") || !user){
            return res.status(400).json({ message: 'Bu işlemi yapmaya yetkiniz yoktur. Lütfen yetkili birisine ulaşınız' });
        } //type eklemeyi sadece admin

        const { type, dataCount, dataNames } = req.body;
        const dataCountInt = parseInt(dataCount); //dataCount sayısını int çeviriyoruz

        const existingType = await Type.findOne({ where: { type } });
        if (existingType) {
            return res.status(400).json({ error: "Bu tip zaten kayıtlı." });
        }

        if(!dataCountInt || dataCountInt<=0){
            return res.status(400).json({error:"Geçerli veri sayısı girmediniz. addNewtype metotu"});
        }

        console.log("datanamesleng",dataNames.length)
        if (!Array.isArray(dataNames) || dataNames.length !== dataCountInt) {
            return res.status(400).json({
                error: "Veri sayısı ile veri isimleri aynı sayıda olmalı : addnewType metotu"
            });
        }

        // Column isimlerinde aynı olan varsa hata döndür
        const uniqueDataNames = new Set(dataNames); //set benzersizliği kontrol eder
        if (uniqueDataNames.size !== dataNames.length) {
            return res.status(400).json({
                error: "Veri isimlerinden bazıları tekrar ediyor. Lütfen benzersiz veri isimleri girin."
            });
        }

        //veri tabanı için json formatına çeviriyoruz
        const dataNamesString = JSON.stringify(dataNames);

        const newType = await Type.create({
            type,
            dataCount:dataCountInt,
            dataNames: dataNamesString,
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
        if (!Array.isArray(types)) {
            return res.status(500).json({ message: 'Veri düzgün alınamadı.' });
        }
        res.status(200).json(types);
    } catch (error) {
        console.error('Tipler alınırken hata:', error);
        res.status(500).json({ message: 'Tipleri alırken bir hata oluştu.' });
    }
};

const getUserSensors = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        let data;

        if (role === "administrator") {
            data = await getAdminSensors(); // Admin tüm verileri görür
        } else if (role === "manager") {
            data = await getManagerSensors(userId); // Manager kendi sensörlerini görür
        } else if (role === "personal") {
            data = await getUserOwnedSensors(userId); // Personal kendi sensörlerini görür
        } else {
            return res.status(403).json({ message: "Bu role erişim izni yok." });
        }

        res.status(200).json(data); // Verileri JSON formatında döndür
    } catch (error) {
        console.error('Sensörleri alırken hata:', error);
        res.status(500).json({ message: 'Sensörleri alırken bir hata oluştu.' });
    }
};

// admin sensör görüntüleme
const getAdminSensors = async () => {

    const allCompanies = await Companies.findAll({
        attributes: ['code', 'name'],
    });

    const managers = await Users.findAll({
        where: { role: "manager" },
        attributes: ['id','creator_id','companyCode', 'name', 'lastname', 'email', 'phone', 'role','isActive'],
    });

    const personals = await Users.findAll({
        where: { role: "personal" },
        attributes: ['id','creator_id','companyCode', 'name', 'lastname', 'email', 'phone', 'role','isActive'],
    });

    // Tüm sensör ve sahiplik bilgilerini getir
    const { sensors, sensorOwners } = await getAllSensors();
    console.log("anlamak",managers)
    // Verileri döndür
    return {
        allCompanies,
        managers,
        personals,
        sensors: sensors, // Sensör verileri
        sensorOwners: sensorOwners, // Sensör sahiplik verileri
    }; //şirketler managerler personeller hepsi burada olur
};

const getManagerSensors = async (userId) => {
    const manager = await Users.findOne({
        where: { id: userId },
        attributes: ['id', 'name','lastname', 'companyCode', 'role','isActive'],
    });

    const personals = await Users.findAll({
        where: { role: "personal",
            creator_id:manager.id
        },
        attributes: ['id','creator_id','companyCode', 'name', 'lastname', 'email', 'phone', 'role','isActive'],
    });

    if (!manager) throw new Error('Manager bulunamadı.');

    const sensorIds = await getSensorIdsByOwner(manager.id);
    const managerSensors = await getSensorsByIds(sensorIds);
    const sensorOwners = await getSensorByOwner(userId,sensorIds);

    const personalSensors = await Promise.all(
        personals.map(async (personal) => {
            const sensors = await getUserOwnedSensors(personal.id);
            return { personalId: personal.id, sensors };
        })
    );
    return{ manager,personals,managerSensors,sensorOwners,personalSensors};
};

const getUserOwnedSensors = async (userId) => {
    try {
        const personal = await Users.findOne({
            where: { id: userId },
            attributes: ['name','lastname', 'companyCode', 'role','isActive'],
        });

        const sensorIds = await getSensorIdsByOwner(userId);

        if (sensorIds.length === 0) {
            return []; // Hiç sensör yoksa boş döndür
        }

        const sensors = await getSensorsByIds(sensorIds);
        return {
            personal,
            sensors
        };
    } catch (error) {
        console.error('Sensörleri alırken hata:', error);
        throw new Error('Sensörleri alırken bir hata oluştu.');
    }
};
const getSensorsByCompany = async (req, res) => {
    const { companyCode } = req.params;

    try {
        // companyCode'ya göre sensörleri çekiyoruz
        const sensors = await Sensors.findAll({
            where: {
                company_code: companyCode, // Şirkete ait sensörler
            },
            attributes: ['id', 'name', 'type'], // Döndürülecek sensör özellikleri
        });

        if (!sensors || sensors.length === 0) {
            return res.status(404).json({ message: 'Bu kurum için sensör bulunamadı.' });
        }

        // Sensörlerin her birinin type'ını sensors_types_table'dan çekip isimlendirme
        const sensorsWithTypeNames = await Promise.all(sensors.map(async (sensor) => {
            // Type ID'si ile sensor_types_table'dan açıklamayı alıyoruz
            const sensorType = await Type.findOne({
                where: { id: sensor.type }, // `type`'ı ID olarak alıp sensor_types_table'dan buluyoruz
                attributes: ['type'], // `type` alanını alıyoruz
            });

            return {
                ...sensor.toJSON(), // Sensor objesini alıyoruz
                typeName: sensorType ? sensorType.type : 'Bilinmeyen Tip', // Eğer tip varsa, yoksa 'Bilinmeyen Tip' döndür
            };
        }));

        // Sensörleri başarıyla döndürüyoruz
        res.status(200).json({ success: true, sensors: sensorsWithTypeNames });
    } catch (error) {
        console.error("Sensör verisi çekilemedi:", error);
        res.status(500).json({ message: 'Sensör verisi çekilemedi. Lütfen tekrar deneyin.' });
    }
};

const getOwnerSensors = async (req, res) => {
    const { userIds } = req.query; // Gelen kullanıcı ID'leri (query parametresi)

    console.log("Gelen userIds:", userIds); // Gelen parametreyi kontrol et

    if (!userIds) {
        return res.status(400).json({ error: "Geçerli kullanıcı kimlikleri sağlanmalıdır." });
    }

    try {

        let sensors = await getSensorIdsByOwner(userIds);
        sensors = await getSensorsByIds(sensors);

        return res.status(200).json({ sensors });
    } catch (error) {
        console.error("Sensör sorgulama hatası:", error);
        return res.status(500).json({ error: "Sensörler alınırken bir hata oluştu." });
    }
};




module.exports = { addNewType, addSensors, getTypes,getUserSensors ,getSensorsByCompany,getOwnerSensors};

