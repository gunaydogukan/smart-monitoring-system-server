const { getAllSensors } = require("../../services/sensorServices"); // sensor bilgilerini alacağımız services
const LastSensorData = require('../../models/logs/LastSensorData');
const sensorData = require('../../config/FurkanHocaDb/sensorDataDb');
const Sequelize = require("sequelize");

const checkSensorDataTimestamp = async (req, res) => {
    try {
        console.log("-----------------------------------------------------------------------")
        console.log("GÖNDERİLEN");
        const { sensors } = req.query;


        if (!sensors || !Array.isArray(sensors)) {
            return res.status(400).json({ message: "Sensör listesi gerekli ve bir dizi olmalıdır." });
        }

        //const datacodeList = sensors.sensors.map(sensor => sensor.datacode.toUpperCase()); // Tüm sensörlerin datacodeleri alındı
        const datacodeList = sensors;

        //burada paralel işlem yapar , ve hızı oldukça arttır
        const results = await Promise.all(
            datacodeList.map(async (datacode) => {
                const table = await findTable(datacode);

                if (!table) {
                    console.log(`Tablo bulunamadı: ${datacode}`);
                    return { datacode, error: "Tablo bulunamadı." };
                }

                const time = await checkSensorTime(table);
                console.log(`Tablo: ${table}, Time: ${time}`);
                return { datacode, time };
            })
        );

        return res.status(200).json(results);
    } catch (err) {
        console.error("Hata checkSensorDataTimestamp METOTU", err);
        return res.status(500).json({ message: "checkSensorDataTimestamp METOTU", error: err.message });
    }
};

const checkSensorTime = async (tableName) => {
    try {
        console.log(`Kontrol edilen sensör (tableName): ${tableName}`);

        const query = `
            SELECT *
            FROM \`${tableName}\`
            ORDER BY time DESC
                LIMIT 1
        `;

        const lastData = await sensorData.query(query, {
            type: Sequelize.QueryTypes.SELECT,
        });

        if (!lastData || lastData.length === 0) {
            console.log("Tabloda veri bulunamadı (checkSensorTime metodu)");
            return null;
        }

        const latestData = lastData[0];

        //BU İŞLEM SİLİNEBİLİR SADECE FURKAN HOCANIN DATABASE'İNDE YAPILABİLİR.
        const [result, created] = await LastSensorData.findOrCreate({
            where: { dataCode: tableName },
            defaults: {
                dataCode: tableName,
                lastUpdatedTime: latestData.time,
            },
        });

        if (!created) {
            result.lastUpdatedTime = latestData.time;
            await result.save();
        }

        console.log(created ? "Yeni kayıt oluşturuldu." : "Mevcut kayıt güncellendi.");

        return result.lastUpdatedTime;
    } catch (error) {
        console.error("Hata: checkSensorTime metodu", error);
        throw new Error("checkSensorTime metodu hatası");
    }
};

//Datacoda göre , veri tablosundan , gerekli tabloyu bulmamıza yarayan metot
const findTable = async (datacode) => {
    try {
        const query = `
            SELECT TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_NAME = :tableName
              AND TABLE_SCHEMA = DATABASE()
        `;

        const result = await sensorData.query(query, {
            replacements: { tableName: datacode },
            type: Sequelize.QueryTypes.SELECT,
        });

        if (result.length > 0) {
            console.log(`Tablo bulundu: ${result[0].TABLE_NAME}`);
            return result[0].TABLE_NAME;
        } else {
            console.log("Tablo bulunamadı.");
            return null;
        }
    } catch (error) {
        console.error("Hata: Tablo bulunamadı.", error);
        throw new Error("Tablo bulma hatası.");
    }
};

module.exports = { checkSensorDataTimestamp };
