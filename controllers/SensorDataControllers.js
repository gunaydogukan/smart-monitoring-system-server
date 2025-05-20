const sensorData = require("../config//FurkanHocaDb/sensorDataDb");
const LastSensorData = require('../models/logs/LastSensorData');
const Sequelize = require("sequelize");
const { Op } = require('sequelize');

// Tablo sütunlarını dinamik olarak almak için yardımcı fonksiyon
//Bunu kullanmamızın sebebi nem'in diğerlerinden fazla sütunu oldugu için
const getTableColumns = async (tableName) => {
    try {
        const columns = await sensorData.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = :tableName AND TABLE_SCHEMA = DATABASE()`,
            {
                replacements: { tableName },
                type: Sequelize.QueryTypes.SELECT,
            }
        );
        console.log("Columns", columns);
        return columns.map(col => col.COLUMN_NAME); // Sadece sütun adlarını döndürüyoruz
    } catch (error) {
        console.error('getTableColumns Metotu Hata:', error);
        return null;
    }
};
// Tabloyu bulma fonksiyonu
const findTable = async (code) => {
    const tableName = code.toUpperCase();
    try {
        const result = await sensorData.query(`SELECT * FROM \`${tableName}\` LIMIT 1`, {
            type: Sequelize.QueryTypes.SELECT,
        });
        return result; // Tabloyu döndür
    } catch (error) {
        console.error('FindTable Metotu Hata:', error);
        return null;
    }
};
//veri yoksa, en son olan verileri getir
const getLatestData = async (tableName, selectedColumns, grouping, rangeInHours) => {
    const endDateQuery = `SELECT MAX(time) as maxTime FROM \`${tableName}\``;  // Tablo adı güvenli şekilde yerleştirilir
    const endDateResult = await sensorData.query(endDateQuery, {
        type: Sequelize.QueryTypes.SELECT,
    });

    const endDate = new Date(endDateResult[0].maxTime);
    console.log(endDate);
    const startDate = new Date(endDate.getTime() - rangeInHours * 60 * 60 * 1000);
    console.log(startDate);
    const query = `
        SELECT ${selectedColumns.join(", ")}
        FROM \`${tableName}\`
        WHERE time BETWEEN :startDate AND :endDate
        GROUP BY DATE_FORMAT(time, '${grouping}')
        ORDER BY time ASC
    `;

    return await sensorData.query(query, {
        replacements: { startDate, endDate },
        type: Sequelize.QueryTypes.SELECT,
    });
};


// Zaman aralığına göre dinamik veri çekme
// Zaman aralığına göre dinamik veri çekme
const getSensorDataByInterval = async (tableName, interval) => {
    let dateRangeStart, dateRangeEnd, rangeInHours;
    const endOfRange = new Date();
    let grouping;

    switch (interval) {
        case '1 Gün':
            dateRangeStart = new Date(endOfRange.getTime() - 24 * 60 * 60 * 1000);  // Son 24 saat
            grouping = '%Y-%m-%d %H:%i';
            rangeInHours = 24;
            break;
        case '1 Hafta':
            dateRangeStart = new Date(endOfRange.getTime() - 7 * 24 * 60 * 60 * 1000);  // Son 7 gün
            grouping = '%Y-%m-%d %H';
            rangeInHours = 7 * 24;
            break;
        case '1 Ay':
            dateRangeStart = new Date(endOfRange.getTime() - 30 * 24 * 60 * 60 * 1000);  // Son 30 gün
            dateRangeEnd = endOfRange;
            grouping = '%Y-%m-%d';
            rangeInHours = 30 * 24;
            break;
        case '3 Ay':
            dateRangeStart = new Date(endOfRange.getTime() - 3 * 30 * 24 * 60 * 60 * 1000);  // Son 90 gün
            dateRangeEnd = endOfRange;
            grouping = '%Y-%m-%d';
            rangeInHours = 90 * 24;
            break;
        case '6 Ay':
            dateRangeStart = new Date(endOfRange.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);  // Son 120 gün
            dateRangeEnd = endOfRange;
            grouping = '%Y-%m-%d';
            rangeInHours = 180 * 24;
            break;
        case '1 Yıl':
            dateRangeStart = new Date(endOfRange.setFullYear(endOfRange.getFullYear() - 1));  // Son 1 yıl
            grouping = '%Y-%m';
            rangeInHours = 365 * 24;
            break;
        default:
            throw new Error('Geçersiz zaman aralığı');
    }

    const start = dateRangeStart;
    const end = dateRangeEnd || endOfRange;

    const columns = await getTableColumns(tableName);
    const selectedColumns = [
        "DATE_FORMAT(time, '" + grouping + "') as time",  // Zaman formatlama
        ...columns
            .filter(col => col !== "time" && col !== "id")  // time ve id hariç tüm sütunlar
            .map(col => `AVG(CASE WHEN ${col} >= 0 THEN ${col} ELSE NULL END) as ${col}`) // Negatif değerleri hariç tutma
    ];

    const query = `
        SELECT ${selectedColumns.join(", ")}
        FROM \`${tableName}\`
        WHERE time BETWEEN :start AND :end
        GROUP BY DATE_FORMAT(time, '${grouping}')
        ORDER BY time ASC
    `;

    const data = await sensorData.query(query, {
        replacements: { start, end },
        type: Sequelize.QueryTypes.SELECT,
    });

/*    silenecek data time işlemi bitince
    //Sensörden gelen en son veri alınıp sensorDataLog table'ına atılır, En son veri ne zaman geldi kontrolü
    if(interval ==="1 Gün"){
        console.log("veriler = ",data);
        const latestData = [...data]
            .sort((a, b) => new Date(b.time) - new Date(a.time))[0];
        console.log("Son veri =", latestData);

        //son veri alınamazsa
        if (!latestData || !latestData.time) {
            console.error("intervalFonk. lastData işlemi ");
            return;
        }

        const [result, created] = await LastSensorData.findOrCreate({
            where: { dataCode: tableName }, // Burada doğru sütunu kullanın
            defaults: {
                dataCode: tableName,
                lastUpdatedTime: latestData.time,
            },
        });

        // Eğer zaten mevcutsa lastUpdatedTime'ı güncelle
        if (!created) {
            result.lastUpdatedTime = latestData.time;
            await result.save();
        }
        console.log(created ? "Yeni kayıt oluşturuldu." : "Mevcut kayıt güncellendi.");
    }

 */

    if (!data || data.length === 0) {
        console.log("Seçilen aralıkta veri yok, en son veri gösteriliyor.");
        return await getLatestData(tableName, selectedColumns, grouping, rangeInHours);
    }

    return data;
};


// Ana veri alma fonksiyonu
// Ana veri alma fonksiyonu
const getSensorData = async (req, res) => {
    const { dataCode, interval } = req.query;

    if (!dataCode) {
        return res.status(400).json({ error: 'DataCode bulunamadı' });
    }

    const code = dataCode.toUpperCase();
    try {
        const tableExists = await findTable(code);
        if (!tableExists) {
            return res.status(404).json({ message: 'Tablo bulunamadı' });
        }

        const data = await getSensorDataByInterval(code, interval);
        if (!data || data.length === 0) {
            return res.status(404).json({ message: 'Veri bulunamadı' });
        }

        res.json({
            message: "Veri başarıyla alındı",
            data: data,
            count: data.length,
        });

    } catch (error) {
        console.error("Veri çekme hatası:", error);
        res.status(500).json({ error: "Veri çekme hatası" });
    }
};



//fake veri ekleme ve dataLog tutma...
//BURADAKİ LastSensorData ' TABLE'NA SENSÖR VERİSİLERİNİ ÇEKERKEN EN SONDAKİ ZAMANI ATICAZ YANİ...
const addSensorData = async (req, res) => {
    const { dataCode, data } = req.body;

    if (!dataCode || !data) {
        return res.status(400).json({ error: "dataCode ve data gereklidir." });
    }

    const code = dataCode.toLowerCase();
    try {
        const tableName = code;

        const tableColumns = await getTableColumns(tableName);

        if (!tableColumns || tableColumns.length === 0) {
            throw new Error(`Tablo sütunları alınamadı: ${tableName}`);
        }

        //gelen data hedef tabloda bulunan sütünlara karşılık geliyor mu , veri bütünlüğünü korur hataları önler
        const validColumns = Object.keys(data).filter(key => tableColumns.includes(key));
        if (validColumns.length === 0) {
            throw new Error("Geçerli sütunlar bulunamadı.");
        }

        // Kolon adları ve değerleri , bu işlem veri güvenliğini sağlamak için direkt sql sorugsu içini verileri yazmamak için
        const columnNames = validColumns.join(", ");
        const placeholders = validColumns.map(() => "?").join(", ");
        const values = validColumns.map(key => data[key]);
        const currentTime = new Date();
        values.push(currentTime);

        const insertQuery = `
            INSERT INTO ${tableName} (${columnNames}, time)
            VALUES (${placeholders}, ?)
        `;
        console.log("SQL Sorgusu:", insertQuery);

        await sequelize.query(insertQuery, {
            replacements: values, //artık soru işareti yerine vlaues geçer güvenlik sağlandı
            type: Sequelize.QueryTypes.INSERT,
        });

        console.log(`${tableName} tablosuna veri eklendi.`);

        // `latest_sensor_data` tablosunu güncelle
        const [latestEntry, created] = await LastSensorData.findOrCreate({
            where: { dataCode },
            defaults: {
                dataCode,
                lastUpdatedTime: currentTime,
            },
        });

        if (!created) {
            latestEntry.lastUpdatedTime = currentTime;
            await latestEntry.save();
        }

        console.log(`latest_sensor_data tablosu güncellendi: ${dataCode}`);
        res.status(201).json({ message: "Veri eklendi ve latest_sensor_data güncellendi." });
    } catch (error) {
        console.error("Veri ekleme hatası:", error.message);
        res.status(500).json({ error: "Veri ekleme hatası.", detail: error.message });
    }
};


module.exports = { getSensorData, addSensorData };
