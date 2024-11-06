const sequelize = require("../config/sensorDatadatabase");
const Sequelize = require("sequelize");
const { Op } = require('sequelize');

// Tablo sütunlarını dinamik olarak almak için yardımcı fonksiyon
//Bunu kullanmamızın sebebi nem'in diğerlerinden fazla sütunu oldugu için
const getTableColumns = async (tableName) => {
    const columns = await sequelize.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = :tableName AND TABLE_SCHEMA = DATABASE()`,
        {
            replacements: { tableName },
            type: Sequelize.QueryTypes.SELECT,
        }
    );
    return columns.map(col => col.COLUMN_NAME); //sadece sütün adları döndürür
};

// Tabloyu bulma fonksiyonu
const findTable = async (code) => {
    const tableName = code;

    try {
        // Tabloyu doğrula
        const result = await sequelize.query(`SELECT * FROM ${tableName} LIMIT 1`, {
            type: Sequelize.QueryTypes.SELECT,
        });
        return result; // Tabloyu döndür
    } catch (error) {
        console.error('Tablo bulunamadı veya sorgu hatası:', error);
        return null;
    }
};

//veri yoksa, en son olan verileri getir
const getLatestData = async (tableName, selectedColumns, grouping, rangeInHours) => {
    const endDateQuery = `SELECT MAX(time) as maxTime FROM ${tableName}`;
    const endDateResult = await sequelize.query(endDateQuery, {
        type: Sequelize.QueryTypes.SELECT,
    });

    const endDate = new Date(endDateResult[0].maxTime);
    console.log(endDate);
    // Başlangıç tarihi, `rangeInHours` kadar geriye gidilerek hesaplanır
    const startDate = new Date(endDate.getTime() - rangeInHours * 60 * 60 * 1000);
    console.log(startDate);
    const query = `
        SELECT ${selectedColumns.join(", ")}
        FROM ${tableName}
        WHERE time BETWEEN :startDate AND :endDate
        GROUP BY DATE_FORMAT(time, '${grouping}')
        ORDER BY time ASC
    `;

    return await sequelize.query(query, {
        replacements: { startDate, endDate },
        type: Sequelize.QueryTypes.SELECT,
    });
};

// Zaman aralığına göre dinamik veri çekme
const getSensorDataByInterval = async (tableName, interval) => {
    let dateRangeStart, dateRangeEnd, rangeInHours;
    const endOfRange = new Date();
    let grouping;
    //console.log(interval);
    switch (interval) {
        case '1 Gün': // 5' dakikada bir
            dateRangeStart = new Date(endOfRange.getTime() - 24 * 60 * 60 * 1000); // Son 24 saat
            grouping = '%Y-%m-%d %H:%i'; // Dakika bazında
            rangeInHours = 24;
            break;
        case '1 Hafta':
            dateRangeStart = new Date(endOfRange.getTime() - 7 * 24 * 60 * 60 * 1000); // Son 7 gün
            grouping = '%Y-%m-%d %H'; // Saat bazında
            rangeInHours = 7 * 24;
            break;
        case '1 Ay':
            dateRangeStart = new Date(endOfRange.getTime() - 30 * 24 * 60 * 60 * 1000); // Son 30 gün
            dateRangeEnd = endOfRange; // Bugüne kadar olan son 30 gün
            grouping = '%Y-%m-%d'; // Gün bazında gruplama
            rangeInHours = 30 * 24;
            break;
        case '3 Ay':
            dateRangeStart = new Date(endOfRange.getTime() - 3*30 * 24 * 60 * 60 * 1000); // Son 90 gün
            dateRangeEnd = endOfRange; // Bugüne kadar olan son 30 gün
            grouping = '%Y-%m-%d'; // Gün bazında gruplama
            rangeInHours = 90 * 24;
            break;
        case '6 Ay':
            dateRangeStart = new Date(endOfRange.getTime() - 6*30 * 24 * 60 * 60 * 1000); // Son 120 gün
            dateRangeEnd = endOfRange; // Bugüne kadar olan son 30 gün
            grouping = '%Y-%m-%d'; // Gün bazında gruplama
            rangeInHours = 180 * 24;
            break;
        case '1 Yıl ':
            dateRangeStart = new Date(endOfRange.setFullYear(endOfRange.getFullYear() - 1)); // Son 1 yıl
            grouping = '%Y-%m'; // Ay bazında
            rangeInHours = 365 * 24;
            break;
        case '5 Yıllık':
            dateRangeStart = new Date(endOfRange.setFullYear(endOfRange.getFullYear() - 5)); // Son 5 yıl
            grouping = '%Y'; // Yıl bazında
            rangeInHours = 5 * 365 * 24;
            break;
        case 'Maksimum':
            // Veritabanında en eski tarihe göre başlangıç tarihini ayarla
            const oldestData = await sequelize.query(
                `SELECT MIN(time) as oldestDate FROM ${tableName} WHERE time IS NOT NULL`,
                { type: Sequelize.QueryTypes.SELECT }
            );
            dateRangeStart = oldestData[0]?.oldestDate ? new Date(oldestData[0].oldestDate) : new Date(endOfRange.setFullYear(endOfRange.getFullYear() - 5));
            grouping = '%Y'; // Maksimum aralığı yıllık bazda gruplandırıyoruz
            break;
        default:
            throw new Error('Geçersiz zaman aralığı');
    }

    const start = dateRangeStart;
    const end = dateRangeEnd || endOfRange;

    // Mevcut sütunları al
    const columns = await getTableColumns(tableName);

    // Sadece mevcut sütunlar üzerinden dinamik olarak sorgu oluştur
    const selectedColumns = [
        "DATE_FORMAT(time, '" + grouping + "') as time",
        ...columns.filter(col => col !== "time").map(col => `AVG(${col}) as ${col}`)
    ]; //time colmu hariç  avg fonk kullnarak ortalama hesabı alınır  ,

    const query = `
        SELECT ${selectedColumns.join(", ")}
        FROM ${tableName}
        WHERE time BETWEEN :start AND :end
        GROUP BY DATE_FORMAT(time, '${grouping}')
        ORDER BY time ASC
    `;


    const data = await sequelize.query(query, {
        replacements: { start, end },
        type: Sequelize.QueryTypes.SELECT,
    });

    // Eğer belirli aralıkta veri yoksa en son veriyi al
    if (!data || data.length === 0) {
        console.log("Seçilen aralıkta veri yok, en son veri gösteriliyor.");
        return await getLatestData(tableName, selectedColumns ,grouping,rangeInHours);
    }

    return data;
};

// Ana veri alma fonksiyonu
const getSensorData = async (req, res) => {
    const { dataCode, interval } = req.query;
    console.log("Gelen dataCode:", dataCode);
    console.log("Gelen interval:", interval);

    if (!dataCode) {
        return res.status(400).json({ error: 'DataCode bulunamadı' });
    }

    const code = dataCode.toLowerCase();
    try {
        const tableExists = await findTable(code);

        if (!tableExists) {
            return res.status(404).json({ message: 'Tablo bulunamadı' });
        }

        const data = await getSensorDataByInterval(code, interval);

        if (!data || data.length === 0) {
            return res.status(404).json({ message: 'Veri bulunamadı' });
        }

        //console.log(data);
        res.json(data);
    } catch (error) {
        console.error("Veri çekme hatası:", error);
        res.status(500).json({ error: "Veri çekme hatası" });
    }
};

module.exports = { getSensorData };
