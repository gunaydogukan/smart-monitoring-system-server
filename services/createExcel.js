const PDFDocument = require('pdfkit');
const os = require('os');
const path = require('path');
const ExcelJS = require('exceljs');
const fs = require('fs');

/**
 * Raporu Excel formatında oluşturur
 * @param {Object} reportData - Rapor verileri
 * @returns {Promise<string>} - Oluşturulan dosyanın yolu
 */
//getTotalSensors
async function generateExcelReportTotalSensors(reportData) {
    const desktopPath = path.join(os.homedir(), 'Desktop'); // Masaüstü yolu

    // Masaüstü dizini yoksa oluştur
    if (!fs.existsSync(desktopPath)) {
        fs.mkdirSync(desktopPath, { recursive: true });
    }

    const filePath = path.join(desktopPath, `${Date.now()}_report.xlsx`);
    const workbook = new ExcelJS.Workbook();

    // Genel bilgiler için bir sayfa ekle
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.addRow(['Toplam Sensör Sayısı', reportData.totalSensors]);
    summarySheet.addRow(['Aktif Sensör Sayısı', reportData.activeSensorsLen]);
    summarySheet.addRow(['Pasif Sensör Sayısı', reportData.passiveSensorsLen]);

    // Aktif sensörler için bir sayfa ekle
    const activeSheet = workbook.addWorksheet('Active Sensors');
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
            sensor.createdAt,
            sensor.updatedAt,
        ]);
    });

    // Pasif sensörler için bir sayfa ekle
    const passiveSheet = workbook.addWorksheet('Passive Sensors');
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
            sensor.createdAt,
            sensor.updatedAt,
        ]);
    });

    // Excel dosyasını kaydet
    await workbook.xlsx.writeFile(filePath);

    return filePath;
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

    const filePath = path.join(desktopPath, `${Date.now()}_report.xlsx`);
    const workbook = new ExcelJS.Workbook();

    // Genel bilgiler için bir sayfa ekle
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.addRow(['Toplam Kullanıcı Sayısı', reportData.totalUsers]);
    summarySheet.addRow(['Aktif Kullanıcı Sayısı', reportData.activeUsersLen]);
    summarySheet.addRow(['Pasif Kullanıcı Sayısı', reportData.passiveUsersLen]);

    // Aktif kullanıcılar için bir sayfa ekle
    const activeSheet = workbook.addWorksheet('Active Users');
    activeSheet.addRow([
        'ID', 'Username', 'Email', 'Role', 'Status', 'Oluşturulma Tarihi', 'Güncellenme Tarihi'
    ]);

    reportData.activeUsers.forEach((user) => {
        activeSheet.addRow([
            user.id, user.username, user.email, user.role, 'Active', user.createdAt, user.updatedAt
        ]);
    });

    // Pasif kullanıcılar için bir sayfa ekle
    const passiveSheet = workbook.addWorksheet('Passive Users');
    passiveSheet.addRow([
        'ID', 'Username', 'Email', 'Role', 'Status', 'Oluşturulma Tarihi', 'Güncellenme Tarihi'
    ]);

    reportData.passiveUsers.forEach((user) => {
        passiveSheet.addRow([
            user.id, user.username, user.email, user.role, 'Passive', user.createdAt, user.updatedAt
        ]);
    });

    // Excel dosyasını kaydet
    await workbook.xlsx.writeFile(filePath);

    return filePath;
}

async function generateExcelReportCompanies(companies) {
    const desktopPath = path.join(os.homedir(), 'Desktop'); // Desktop path

    // Create directory if it doesn't exist
    if (!fs.existsSync(desktopPath)) {
        fs.mkdirSync(desktopPath, { recursive: true });
    }

    const filePath = path.join(desktopPath, `${Date.now()}_company_report.xlsx`);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Company Report');

    // Define columns
    sheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Plate', key: 'plate', width: 20 },
        { header: 'Code', key: 'code', width: 15 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Active', key: 'isActive', width: 10 },
        { header: 'Created At', key: 'createdAt', width: 20 },
        { header: 'Updated At', key: 'updatedAt', width: 20 }
    ];

    // Add data to the Excel sheet
    companies.forEach((company) => {
        sheet.addRow({
            id: company.id,
            plate: company.plate,
            code: company.code,
            name: company.name,
            isActive: company.isActive,
            createdAt: company.createdAt,
            updatedAt: company.updatedAt
        });
    });

    await workbook.xlsx.writeFile(filePath);
    return filePath;
}


async function generateExcelReportTypeClass(groupedSensors, groupedLengths, types) {
    const desktopPath = path.join(os.homedir(), 'Desktop'); // Desktop path

    // Create directory if it doesn't exist
    if (!fs.existsSync(desktopPath)) {
        fs.mkdirSync(desktopPath, { recursive: true });
    }

    const filePath = path.join(desktopPath, `${Date.now()}_sensor_report.xlsx`);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sensor Report');

    // Define columns
    sheet.columns = [
        { header: 'Type', key: 'type', width: 25 },
        { header: 'Sensor Code', key: 'datacode', width: 15 },
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Latitude', key: 'lat', width: 15 },
        { header: 'Longitude', key: 'lng', width: 15 }
    ];

    // Add data to the Excel sheet
    Object.keys(groupedSensors).forEach((type) => {
        const typeName = types.find(t => t.id == type)?.type || 'Unknown'; // Get the type name
        sheet.addRow({ type: `${typeName} (${groupedLengths[type]} sensors)` });
        groupedSensors[type].forEach((sensor) => {
            sheet.addRow({
                type: '',
                datacode: sensor.datacode,
                name: sensor.name,
                lat: sensor.lat,
                lng: sensor.lng
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
const generateExcelReportCompanyStats = async (groupedLengths, company, groupedCompany) => {
    const desktopPath = path.join(os.homedir(), 'Desktop'); // Masaüstü yolu

    // Masaüstü dizini yoksa oluştur
    if (!fs.existsSync(desktopPath)) {
        fs.mkdirSync(desktopPath, { recursive: true });
    }

    const filePath = path.join(desktopPath, `${Date.now()}_detailed_company_sensor_report.xlsx`);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Company Sensor Stats');

    // Başlıklar
    sheet.columns = [
        { header: 'Şirket Kodu', key: 'companyCode', width: 15 },
        { header: 'Şirket Adı', key: 'companyName', width: 25 },
        { header: 'Sensör ID', key: 'sensorId', width: 10 },
        { header: 'Sensör Kod', key: 'sensorCode', width: 15 },
        { header: 'Sensör İsim', key: 'sensorName', width: 25 },
        { header: 'Tür', key: 'sensorType', width: 10 },
        { header: 'Aktif Durumu', key: 'isActive', width: 15 },
    ];

    let currentRow = 1; // Mevcut satır numarası

    // Şirketlere göre sensör detayları
    company.forEach(comp => {
        // Şirket başlığı
        sheet.addRow({}).getCell(1).value = `${comp.name} (${comp.code})`; // Şirket Adı (Kodu)
        sheet.mergeCells(`A${currentRow}:G${currentRow}`); // Tüm sütunları birleştir
        sheet.getRow(currentRow).font = { bold: true, size: 14 }; // Kalın ve büyük yazı
        currentRow++;

        // Şirket toplam sensör sayısı
        sheet.addRow({
            companyCode: 'Toplam Sensör Sayısı:',
            companyName: groupedLengths[comp.code] || 0,
        }).getCell(1).font = { bold: true, size: 12 };
        currentRow++;

        // Şirket sensörleri
        const sensors = groupedCompany[comp.code] || [];
        if (sensors.length > 0) {
            sensors.forEach(sensor => {
                sheet.addRow({
                    companyCode: comp.code,
                    companyName: comp.name,
                    sensorId: sensor.id,
                    sensorCode: sensor.datacode,
                    sensorName: sensor.name,
                    sensorType: sensor.type,
                    isActive: sensor.isActive ? 'Aktif' : 'Pasif',
                });
                currentRow++;
            });
        } else {
            // Sensör bulunmuyorsa
            sheet.addRow({
                companyCode: '',
                companyName: 'Sensör Bulunamadı',
            });
            currentRow++;
        }

        // Her şirketten sonra boşluk bırak
        currentRow++;
    });

    // Otomatik satır yüksekliği
    sheet.eachRow(row => {
        row.height = 20;
    });

    // Dosyayı kaydet
    await workbook.xlsx.writeFile(filePath);
    console.log('Excel raporu oluşturuldu:', filePath);
    return filePath;
};


module.exports = {generateExcelReportTotalSensors,generateExcelReportIsActive,generateExcelReportCompanies,generateExcelReportTypeClass,generateExcelReportCompanyStats};