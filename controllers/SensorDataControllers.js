const sensorData = require("../config//FurkanHocaDb/sensorDataDb");
const LastSensorData = require('../models/logs/LastSensorData');
const Sequelize = require("sequelize");
const { Op } = require('sequelize');
const Sensors = require("../models/sensors/Sensors");
// Tablo sütunlarını dinamik olarak almak için yardımcı fonksiyon
//Bunu kullanmamızın sebebi nem'in diğerlerinden fazla sütunu oldugu için

// Nem Yüzdesi Hesaplama Fonksiyonu
let minValue = 0;
let maxValue = 100;
const calculateAverageHumidity = (sagustNem, sagaltNem, solaltNem, minValue, maxValue) => {
    // -9998 ve -9999 değerlerini filtrele ve sayıya çevir
    const validValues = [sagustNem, sagaltNem, solaltNem]
        .map((value) => parseFloat(value))
        .filter((value) => value !== -9998 && value !== -9999 && !isNaN(value));

    // Geçerli değerlerin ortalamasını al
    if (validValues.length > 0) {
        const total = validValues.reduce((sum, value) => sum + value, 0);
        const average = total / validValues.length;

        // Ortalamayı yüzdelik değere çevir
        const percentage = ((average - minValue) / (maxValue - minValue)) * 100;

        // Yüzdelik değeri 0 ile 100 arasında sınırla
        return Math.min(Math.max(percentage, 0), 100);
    }
    return 0; // Geçerli değer yoksa 0 döndür
};

const getSoilMoistureData = async (req, res) => {
    try {
        // 1. Sensors Tablosundan type = 1 Olanları Al
        const sensors = await Sensors.findAll({
            where: { type: 1 },
            attributes: ['datacode', 'lat', 'lng', 'name'], // Gerekli kolonları al
        });

        if (!sensors || sensors.length === 0) {
            return res.status(404).json({ error: 'Hiç sensör bulunamadı.' });
        }

        // 2. Her Sensör için Veriyi Al ve Yüzdelik Hesapla
        const results = await Promise.all(
            sensors.map(async (sensor) => {
                const { datacode, lat, lng, name } = sensor;

                try {
                    // Datacode'e Göre Tablo Sorgula
                    const query = `
                        SELECT sagustNem, sagaltNem, solaltNem, time
                        FROM \`${datacode}\`
                        ORDER BY time DESC
                            LIMIT 288
                    `;
                    const rawData = await sensorData.query(query, {
                        type: Sequelize.QueryTypes.SELECT,
                    });

                    // Eğer veri yoksa sensörü atla
                    if (!rawData || rawData.length === 0) {
                        return null;
                    }

                    // Ham Veriyi Yüzdelik Hesapla
                    const processedData = rawData.map((data) => ({
                        time: data.time,
                        humidity: calculateAverageHumidity(
                            data.sagustNem,
                            data.sagaltNem,
                            data.solaltNem,
                           minValue,
                            maxValue
                        ),
                    }));

                    // Sensör Bilgisiyle Birleştir
                    return {
                        datacode,
                        name, // Sensör adı
                        lat,
                        lng,
                        data: processedData,
                    };
                } catch (error) {
                    if (error.original && error.original.code === 'ER_NO_SUCH_TABLE') {
                        console.warn(`Tablo bulunamadı: ${datacode}`);
                        return null; // Tablo yoksa null döndür
                    }
                    throw error; // Diğer hataları yükselt
                }
            })
        );

        // Geçerli olan (null olmayan) sonuçları filtrele
        const validResults = results.filter((result) => result !== null);

        // 3. Veriyi Frontend'e Gönder
        res.json({
            message: 'Nem haritası verileri başarıyla alındı.',
            sensors: validResults,
        });
    } catch (error) {
        console.error('getSoilMoistureData Hatası:', error);
        res.status(500).json({ error: 'Nem haritası verileri alınamadı.', detail: error.message });
    }
};


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


module.exports = { getSensorData, addSensorData ,getSoilMoistureData };
