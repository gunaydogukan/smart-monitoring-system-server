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

// Zaman aralığına göre dinamik veri çekme
const getSensorDataByInterval = async (tableName, interval) => {
    let dateRangeStart, dateRangeEnd;
    const endOfRange = new Date();
    let grouping;

    switch (interval) {
        case 'dakikalık':
            dateRangeStart = new Date(endOfRange.getTime() - 24 * 60 * 60 * 1000); // Son 24 saat
            grouping = '%Y-%m-%d %H:%i'; // Dakika bazında
            break;
        case 'saatlik':
            dateRangeStart = new Date(endOfRange.getTime() - 7 * 24 * 60 * 60 * 1000); // Son 7 gün
            grouping = '%Y-%m-%d %H'; // Saat bazında
            break;
        case 'günlük':
            dateRangeStart = new Date(endOfRange.getTime() - 30 * 24 * 60 * 60 * 1000); // Son 30 gün
            dateRangeEnd = endOfRange; // Bugüne kadar olan son 30 gün
            grouping = '%Y-%m-%d'; // Gün bazında gruplama
            break;
        case 'aylık':
            dateRangeStart = new Date(endOfRange.setFullYear(endOfRange.getFullYear() - 1)); // Son 1 yıl
            grouping = '%Y-%m'; // Ay bazında
            break;
        case 'yıllık':
            dateRangeStart = new Date(endOfRange.setFullYear(endOfRange.getFullYear() - 5)); // Son 5 yıl
            grouping = '%Y'; // Yıl bazında
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

    return await sequelize.query(query, {
        replacements: { start, end },
        type: Sequelize.QueryTypes.SELECT,
    });
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

        console.log(data);
        res.json(data);
    } catch (error) {
        console.error("Veri çekme hatası:", error);
        res.status(500).json({ error: "Veri çekme hatası" });
    }
};

module.exports = { getSensorData };
