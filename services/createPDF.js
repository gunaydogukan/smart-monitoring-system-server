const PDFDocument = require('pdfkit');
const os = require('os');
const path = require('path');
const ExcelJS = require('exceljs');
const fs = require('fs');

/**
 * Profesyonel PDF raporu oluşturma
 * @param {Object} reportData - Rapor verileri
 */
//getTotalSensors
async function generateReportTotalSensros(reportData) {
    const desktopPath = path.join(os.homedir(), 'Desktop'); // Masaüstü yolu

    // Masaüstü dizini yoksa oluştur
    if (!fs.existsSync(desktopPath)) {
        fs.mkdirSync(desktopPath, { recursive: true });
    }

    const filePath = path.join(desktopPath, `${Date.now()}_report.pdf`);
    const doc = new PDFDocument();

    doc.pipe(fs.createWriteStream(filePath));

    // Başlık
    doc.fontSize(20).text('Rapor', { align: 'center' });
    doc.moveDown();

    // Toplam bilgiler
    doc.fontSize(12).text(`Toplam Sensör Sayısı: ${reportData.totalSensors}`);
    doc.text(`Aktif Sensör Sayısı: ${reportData.activeSensorsLen}`);
    doc.text(`Pasif Sensör Sayısı: ${reportData.passiveSensorsLen}`);
    doc.moveDown();

    // Aktif sensörler
    doc.fontSize(14).text('Aktif Sensörler:', { underline: true });
    reportData.activeSensors.forEach((sensor, index) => {
        doc.fontSize(12).text(`${index + 1}. ID: ${sensor.id}`);
        doc.text(`   Kod: ${sensor.datacode}`);
        doc.text(`   İsim: ${sensor.name}`);
        doc.text(`   Koordinatlar: (${sensor.lat}, ${sensor.lng})`);
        doc.text(`   Tanım: ${sensor.def}`);
        doc.text(`   Tür: ${sensor.type}`);
        doc.text(`   Şirket Kodu: ${sensor.company_code}`);
        doc.text(`   Köy ID: ${sensor.village_id}`);
        doc.text(`   Oluşturulma Tarihi: ${sensor.createdAt}`);
        doc.text(`   Güncellenme Tarihi: ${sensor.updatedAt}`);
        doc.moveDown();
    });

    // Pasif sensörler
    doc.fontSize(14).text('Pasif Sensörler:', { underline: true });
    reportData.passiveSensors.forEach((sensor, index) => {
        doc.fontSize(12).text(`${index + 1}. ID: ${sensor.id}`);
        doc.text(`   Kod: ${sensor.datacode}`);
        doc.text(`   İsim: ${sensor.name}`);
        doc.text(`   Koordinatlar: (${sensor.lat}, ${sensor.lng})`);
        doc.text(`   Tanım: ${sensor.def}`);
        doc.text(`   Tür: ${sensor.type}`);
        doc.text(`   Şirket Kodu: ${sensor.company_code}`);
        doc.text(`   Köy ID: ${sensor.village_id}`);
        doc.text(`   Oluşturulma Tarihi: ${sensor.createdAt}`);
        doc.text(`   Güncellenme Tarihi: ${sensor.updatedAt}`);
        doc.moveDown();
    });

    // Raporun altına tarih ekle
    doc.moveDown();
    doc.fontSize(10).text(`Oluşturulma Tarihi: ${new Date().toLocaleString()}`, { align: 'right' });

    doc.end();

    return filePath;
}

/**
 * Raporu PDF formatında oluşturur
 * @param {Array} active - Aktif kullanıcılar
 * @param {Array} passive - Pasif kullanıcılar
 * @returns {Promise<string>} - Oluşturulan dosyanın yolu
 */
async function generatePDFReportIsActive(reportData) {
    const desktopPath = path.join(os.homedir(), 'Desktop'); // Desktop path

    // Create directory if it doesn't exist
    if (!fs.existsSync(desktopPath)) {
        fs.mkdirSync(desktopPath, { recursive: true });
    }

    const filePath = path.join(desktopPath, `${Date.now()}_report.pdf`);
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(18).text('Kullanıcı Durum Raporu', { align: 'center' });

    // Add Active Users section
    doc.fontSize(14).text(`Aktif Kullanıcı Sayısı: ${reportData.activeUsersLen}`, { align: 'left' });
    reportData.activeUsers.forEach((user, index) => {
        doc.text(`${index + 1}. ${user.dataValues.name} - Aktif`);
    });

    doc.moveDown();

    // Add Passive Users section
    doc.fontSize(14).text(`Passive Users: ${reportData.passiveUsersLen}`, { align: 'left' });
    reportData.passiveUsers.forEach((user, index) => {
        doc.text(`${index + 1}. ${user.dataValues.name} - Pasif`);
    });

    doc.end();
    return filePath;
}

async function generatePDFReportCompanies(companies) {
    const desktopPath = path.join(os.homedir(), 'Desktop'); // Desktop path

    // Create directory if it doesn't exist
    if (!fs.existsSync(desktopPath)) {
        fs.mkdirSync(desktopPath, { recursive: true });
    }

    const filePath = path.join(desktopPath, `${Date.now()}_company_report.pdf`);
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(18).text('Company Report', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text(`Total Companies: ${companies.length}`, { align: 'left' });

    companies.forEach((company, index) => {
        doc.text(`${index + 1}. ${company.name} (Code: ${company.code}, Plate: ${company.plate}, Active: ${company.isActive ? 'Yes' : 'No'})`);
    });

    doc.end();
    return filePath;
}


async function generatePDFReportTypeClass(groupedSensors, groupedLengths, types) {
    const desktopPath = path.join(os.homedir(), 'Desktop'); // Desktop path

    // Create directory if it doesn't exist
    if (!fs.existsSync(desktopPath)) {
        fs.mkdirSync(desktopPath, { recursive: true });
    }

    const filePath = path.join(desktopPath, `${Date.now()}_sensor_report.pdf`);
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(18).text('Sensor Types Report', { align: 'center' });

    // Iterate over grouped sensors and types
    Object.keys(groupedSensors).forEach((type) => {
        const typeName = types.find(t => t.id == type)?.type || 'Unknown'; // Get the type name from types
        doc.fontSize(14).text(`${typeName}: ${groupedLengths[type]} sensors`, { align: 'left' });
        groupedSensors[type].forEach((sensor, index) => {
            doc.text(`${index + 1}. ${sensor.datacode} - ${sensor.name}, Location: ${sensor.lat}, ${sensor.lng}`);
        });
        doc.moveDown();
    });

    doc.end();
    return filePath;
}

/**
 * Generate PDF Report for Grouped Sensors by Company
 */
const generatePdfReportCompanyStats = async (groupedLengths, companies, groupedCompany) => {
    const desktopPath = path.join(os.homedir(), 'Desktop'); // Save path for desktop
    if (!fs.existsSync(desktopPath)) {
        fs.mkdirSync(desktopPath, { recursive: true });
    }

    const filePath = path.join(desktopPath, `CompanySensorStats_${Date.now()}.pdf`);
    const doc = new PDFDocument();

    doc.pipe(fs.createWriteStream(filePath));

    // Add Header
    doc.fontSize(18).text('Company Sensor Stats', { align: 'center' });
    doc.moveDown();

    // Add Grouped Lengths
    doc.fontSize(14).text('Grouped Lengths:', { underline: true });
    Object.entries(groupedLengths).forEach(([companyCode, count]) => {
        doc.text(`- ${companyCode}: ${count} sensors`);
    });
    doc.moveDown();

    // Add Company Details
    doc.fontSize(14).text('Company Details:', { underline: true });
    companies.forEach(company => {
        doc.text(`- ${company.name} (Code: ${company.code}, Active: ${company.isActive})`);
    });
    doc.moveDown();

    // Add Grouped Sensors
    doc.fontSize(14).text('Sensors Grouped by Company:', { underline: true });
    Object.entries(groupedCompany).forEach(([companyCode, sensors]) => {
        doc.text(`Company Code: ${companyCode}`);
        sensors.forEach(sensor => {
            doc.text(`  - ${sensor.name} (${sensor.datacode}, Active: ${sensor.isActive})`);
        });
        doc.moveDown();
    });

    // Footer
    doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });

    doc.end();

    console.log(`PDF saved at: ${filePath}`);
    return filePath;
};

// Log verilerini PDF formatında oluşturma
const generatePDFSensorLog = async (logsData) => {
    const PDFDocument = require('pdfkit');
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    try {
        // Logların bulunduğundan emin olun
        const logs = logsData.logs;

        if (!Array.isArray(logs) || logs.length === 0) {
            throw new Error("Log verisi bulunamadı veya geçersiz.");
        }

        const desktopPath = path.join(os.homedir(), 'Desktop');
        if (!fs.existsSync(desktopPath)) {
            fs.mkdirSync(desktopPath, { recursive: true });
        }

        const filePath = path.join(desktopPath, `${Date.now()}_sensor_logs.pdf`);
        const doc = new PDFDocument();

        doc.pipe(fs.createWriteStream(filePath));

        doc.fontSize(18).text('Sensor Logs Report', { align: 'center' });
        doc.moveDown();

        logs.forEach((log, index) => {
            doc.fontSize(12).text(`Log #${index + 1}`, { underline: true });
            doc.text(`Log ID: ${log.id}`);
            doc.text(`Sensor ID: ${log.sensorId}`);
            doc.text(`Action: ${log.action}`);
            doc.text(`Old Data: ${log.oldData}`);
            doc.text(`New Data: ${log.newData}`);
            doc.text(`Timestamp: ${log.timestamp}`);
            doc.moveDown();
        });

        doc.end();
        console.log('PDF dosyası başarıyla oluşturuldu:', filePath);
        return filePath;
    } catch (error) {
        console.error('PDF dosyası oluşturulurken bir hata oluştu:', error);
        throw new Error('PDF dosyası oluşturulamadı.');
    }
};


module.exports = {
    generateReportTotalSensros,
    generatePDFReportIsActive,
    generatePDFReportCompanies,
    generatePDFReportTypeClass,
    generatePdfReportCompanyStats,
    generatePDFSensorLog
};
