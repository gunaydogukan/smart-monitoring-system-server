const PDFDocument = require('pdfkit');
const os = require('os');
const path = require('path');
const ExcelJS = require('exceljs');
const fs = require('fs');

/**
 * Sensör Raporunu Excel formatında oluşturur
 * @param {Object} reportData - Rapor verileri
 * @returns {Promise<string>} - Oluşturulan dosyanın yolu
 */
async function generateExcelReportTotalSensors(reportData) {
    try {
        const desktopPath = path.join(os.homedir(), 'Desktop');

        // Masaüstü dizini yoksa oluştur
        if (!fs.existsSync(desktopPath)) {
            fs.mkdirSync(desktopPath, { recursive: true });
        }

        const filePath = path.join(desktopPath, `TumSensorlerinRaporu_${Date.now()}.xlsx`);
        const workbook = new ExcelJS.Workbook();

        // Genel bilgiler için bir sayfa ekle
        const summarySheet = workbook.addWorksheet('Özet');
        summarySheet.addRow(['Toplam Sensör Sayısı', reportData.totalSensors]);
        summarySheet.addRow(['Aktif Sensör Sayısı', reportData.activeSensorsLen]);
        summarySheet.addRow(['Pasif Sensör Sayısı', reportData.passiveSensorsLen]);

        // Aktif sensörler için bir sayfa ekle
        const activeSheet = workbook.addWorksheet('Aktif Sensörler');
        activeSheet.addRow([
            'ID',
            'Kod',
            'İsim',
            'Koordinatlar (Lat, Lng)',
            'Tanım',
            'Tür',
            'Şirket Kodu',
            'Köy ID',
            'Oluşturulma Tarihi',
            'Güncellenme Tarihi',
        ]);
        reportData.activeSensors.forEach((sensor) => {
            activeSheet.addRow([
                sensor.id,
                sensor.datacode,
                sensor.name,
                `${sensor.lat}, ${sensor.lng}`,
                sensor.def,
                sensor.type,
                sensor.company_code,
                sensor.village_id,
                new Date(sensor.createdAt).toLocaleString('tr-TR'),
                new Date(sensor.updatedAt).toLocaleString('tr-TR'),
            ]);
        });

        // Pasif sensörler için bir sayfa ekle
        const passiveSheet = workbook.addWorksheet('Pasif Sensörler');
        passiveSheet.addRow([
            'ID',
            'Kod',
            'İsim',
            'Koordinatlar (Lat, Lng)',
            'Tanım',
            'Tür',
            'Şirket Kodu',
            'Köy ID',
            'Oluşturulma Tarihi',
            'Güncellenme Tarihi',
        ]);
        reportData.passiveSensors.forEach((sensor) => {
            passiveSheet.addRow([
                sensor.id,
                sensor.datacode,
                sensor.name,
                `${sensor.lat}, ${sensor.lng}`,
                sensor.def,
                sensor.type,
                sensor.company_code,
                sensor.village_id,
                new Date(sensor.createdAt).toLocaleString('tr-TR'),
                new Date(sensor.updatedAt).toLocaleString('tr-TR'),
            ]);
        });

        // Excel dosyasını kaydet
        await workbook.xlsx.writeFile(filePath);

        console.log(`Excel başarıyla oluşturuldu: ${filePath}`);
        return filePath;
    } catch (error) {
        console.error('Excel oluşturulurken hata oluştu:', error);
        throw new Error('Excel raporu oluşturulamadı.');
    }
}


/**
 * Raporu Excel formatında oluşturur
 * @param {Object} reportData - Rapor verileri
 * @returns {Promise<string>} - Oluşturulan dosyanın yolu
 */
async function generateExcelReportIsActive(reportData) {
    const desktopPath = path.join(os.homedir(), 'Desktop'); // Masaüstü yolu

    // Masaüstü dizini yoksa oluştur
    if (!fs.existsSync(desktopPath)) {
        fs.mkdirSync(desktopPath, { recursive: true });
    }

    const filePath = path.join(desktopPath, `KullaniciDurumuRaporu_${Date.now()}.xlsx`);
    const workbook = new ExcelJS.Workbook();

    // Genel bilgiler için bir sayfa ekle
    const summarySheet = workbook.addWorksheet('Özet');
    summarySheet.addRow(['Toplam Kullanıcı Sayısı', reportData.totalUsers]);
    summarySheet.addRow(['Aktif Kullanıcı Sayısı', reportData.activeUsersLen]);
    summarySheet.addRow(['Pasif Kullanıcı Sayısı', reportData.passiveUsersLen]);

    // Aktif kullanıcılar için bir sayfa ekle
    const activeSheet = workbook.addWorksheet('Aktif Kullanıcılar');
    activeSheet.addRow([
        'ID', 'Kullanıcı Adı', 'Kullanıcı Soyadı', 'Email', 'Rol', 'Durum', 'Oluşturulma Tarihi', 'Güncellenme Tarihi'
    ]);

    reportData.activeUsers.forEach((user) => {
        activeSheet.addRow([
            user.id,
            user.name || 'Bilinmiyor',
            user.lastname || 'Bilinmiyor',
            user.email || 'Bilinmiyor',
            user.role || 'Bilinmiyor',
            'Aktif',
            new Date(user.createdAt).toLocaleString('tr-TR'),
            new Date(user.updatedAt).toLocaleString('tr-TR'),
        ]);
    });

    // Pasif kullanıcılar için bir sayfa ekle
    const passiveSheet = workbook.addWorksheet('Pasif Kullanıcılar');
    passiveSheet.addRow([
        'ID', 'Kullanıcı Adı', 'Kullanıcı Soyadı', 'Email', 'Rol', 'Durum', 'Oluşturulma Tarihi', 'Güncellenme Tarihi'
    ]);

    reportData.passiveUsers.forEach((user) => {
        passiveSheet.addRow([
            user.id,
            user.name || 'Bilinmiyor',
            user.lastname || 'Bilinmiyor',
            user.email || 'Bilinmiyor',
            user.role || 'Bilinmiyor',
            'Pasif',
            new Date(user.createdAt).toLocaleString('tr-TR'),
            new Date(user.updatedAt).toLocaleString('tr-TR'),
        ]);
    });

    // Excel dosyasını kaydet
    await workbook.xlsx.writeFile(filePath);

    console.log(`Excel başarıyla oluşturuldu: ${filePath}`);
    return filePath;
}


async function generateExcelReportCompanies(companies) {
    const ExcelJS = require('exceljs');
    const desktopPath = path.join(os.homedir(), 'Desktop');

    if (!fs.existsSync(desktopPath)) {
        fs.mkdirSync(desktopPath, { recursive: true });
    }

    const fileName = `SirketlerRaporu${Date.now()}.xlsx`;
    const filePath = path.join(desktopPath, fileName);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Şirket Raporu');

    // Başlık
    worksheet.columns = [
        { header: 'Sıra', key: 'index', width: 10 },
        { header: 'Şirket Adı', key: 'name', width: 30 },
        { header: 'Kod', key: 'code', width: 15 },
        { header: 'Plaka', key: 'plate', width: 10 },
        { header: 'Aktif Mi?', key: 'isActive', width: 10 },
    ];

    // Veri ekleme
    companies.forEach((company, index) => {
        worksheet.addRow({
            index: index + 1,
            name: company.name,
            code: company.code,
            plate: company.plate,
            isActive: company.isActive ? 'Evet' : 'Hayır',
        });
    });

    await workbook.xlsx.writeFile(filePath);
    console.log(`Excel dosyası başarıyla oluşturuldu: ${filePath}`);
    return filePath;
}

async function generateExcelReportTypeClass(groupedSensors, groupedLengths, types) {
    const desktopPath = path.join(os.homedir(), "Desktop");

    if (!fs.existsSync(desktopPath)) {
        fs.mkdirSync(desktopPath, { recursive: true });
    }

    const filePath = path.join(desktopPath, `SensorTipRaporu_${Date.now()}.xlsx`);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sensör Tip Raporu");

    sheet.columns = [
        { header: "Tip", key: "type", width: 25 },
        { header: "Sensör Kodu", key: "datacode", width: 15 },
        { header: "İsim", key: "name", width: 25 },
        { header: "Enlem", key: "lat", width: 15 },
        { header: "Boylam", key: "lng", width: 15 },
    ];

    Object.keys(groupedSensors).forEach((type) => {
        const typeName = types && types.find((t) => t.id == type)?.type || "Bilinmiyor";
        sheet.addRow({ type: `${typeName} (${groupedLengths[type]} sensör)` });
        groupedSensors[type].forEach((sensor) => {
            sheet.addRow({
                type: "",
                datacode: sensor.datacode,
                name: sensor.name,
                lat: sensor.lat,
                lng: sensor.lng,
            });
        });
    });

    await workbook.xlsx.writeFile(filePath);
    return filePath;
}

/**
 * Şirketlere göre sensörleri ve toplam bilgilerini düzenli bir Excel raporunda oluşturma
 * @param {Object} groupedLengths - Şirketlere göre sensör sayıları
 * @param {Array} company - Şirket bilgileri
 * @param {Object} groupedCompany - Şirketlere göre sensör detayları
 */
/**
 * Şirketlere göre sensörlerin Excel raporunu oluşturur.
 */
const generateExcelReportCompanyStats = async (groupedLengths, companies, groupedCompany) => {
    const desktopPath = path.join(os.homedir(), "Desktop");

    if (!fs.existsSync(desktopPath)) {
        fs.mkdirSync(desktopPath, { recursive: true });
    }

    const filePath = path.join(desktopPath, `SirketSensörRaporu_${Date.now()}.xlsx`);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Şirket Sensör Raporu");

    sheet.columns = [
        { header: "Şirket Adı", key: "companyName", width: 30 },
        { header: "Şirket Kodu", key: "companyCode", width: 15 },
        { header: "Toplam Sensör", key: "totalSensors", width: 20 },
        { header: "Sensör Kodu", key: "sensorCode", width: 20 },
        { header: "Sensör Adı", key: "sensorName", width: 25 },
        { header: "Tür", key: "type", width: 15 },
        { header: "Durum", key: "isActive", width: 15 },
    ];

    companies.forEach(company => {
        const sensors = groupedCompany[company.code] || [];

        sheet.addRow({
            companyName: `${company.name} (${company.code})`,
            totalSensors: groupedLengths[company.code] || 0,
        });

        sensors.forEach(sensor => {
            sheet.addRow({
                companyName: "",
                companyCode: company.code,
                sensorCode: sensor.datacode,
                sensorName: sensor.name,
                type: sensor.type,
                isActive: sensor.isActive ? "Aktif" : "Pasif",
            });
        });

        sheet.addRow({}); // Boşluk bırak
    });

    await workbook.xlsx.writeFile(filePath);
    return filePath;
};
/**
 * Sensör logları için Excel raporu oluşturur.
 */
const generateExcelSensorLog = async (logs) => {
    const desktopPath = path.join(os.homedir(), "Desktop");

    if (!fs.existsSync(desktopPath)) {
        fs.mkdirSync(desktopPath, { recursive: true });
    }

    const filePath = path.join(desktopPath, `SensörLogRaporu_${Date.now()}.xlsx`);

    const workbook = new ExcelJS.Workbook();

    // Özet Sayfası
    const summarySheet = workbook.addWorksheet("Özet Bilgiler");
    summarySheet.columns = [
        { header: "Kategori", key: "category", width: 30 },
        { header: "Toplam Sayı", key: "count", width: 15 },
    ];
    Object.entries(logs.summary).forEach(([category, count]) => {
        summarySheet.addRow({ category, count });
    });

    // Detaylar Sayfası
    const detailsSheet = workbook.addWorksheet("Detaylar");
    detailsSheet.columns = [
        { header: "ID", key: "id", width: 10 },
        { header: "Sensör ID", key: "sensorId", width: 15 },
        { header: "Kategori", key: "action", width: 20 },
        { header: "Eski Veri", key: "oldData", width: 30 },
        { header: "Yeni Veri", key: "newData", width: 30 },
        { header: "Tarih", key: "timestamp", width: 25 },
        { header: "Sensör Adı", key: "sensorName", width: 20 },
    ];

    Object.keys(logs.details).forEach((category) => {
        logs.details[category].forEach((log) => {
            detailsSheet.addRow({
                id: log.id,
                sensorId: log.sensorId,
                action: category,
                oldData: log.oldData,
                newData: log.newData,
                timestamp: log.timestamp,
                sensorName: log.sensorName,
            });
        });
    });

    await workbook.xlsx.writeFile(filePath);
    return filePath;
};


module.exports = {
    generateExcelReportTotalSensors,
    generateExcelReportIsActive,
    generateExcelReportCompanies,
    generateExcelReportTypeClass,
    generateExcelReportCompanyStats,
    generateExcelSensorLog
};