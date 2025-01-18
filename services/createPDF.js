const PDFDocument = require('pdfkit');
const os = require('os');
const path = require('path');
const fs = require('fs');

/**
 * Sensör Raporu PDF oluşturma
 * @param {Object} reportData - Rapor verileri
 */
async function generateReportTotalSensors(reportData) {
    try {
        const desktopPath = path.join(os.homedir(), 'Desktop');
        if (!fs.existsSync(desktopPath)) {
            fs.mkdirSync(desktopPath, { recursive: true });
        }

        const fileName = `TotalSensorsReport_${Date.now()}.pdf`;
        const filePath = path.join(desktopPath, fileName);

        const doc = new PDFDocument({ size: 'A4', margin: 40 });

        // Türkçe destekli fontu kontrol et ve yükle
        const fontPath = path.join(__dirname, '../fonts/DejaVuSans.ttf');
        if (!fs.existsSync(fontPath)) {
            throw new Error(`Font dosyası bulunamadı: ${fontPath}`);
        }
        doc.registerFont('TurkishFont', fontPath);
        doc.font('TurkishFont');

        // Dosya yazma işlemi
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Başlık ve genel bilgiler
        doc.fontSize(20).text('Sensör Raporu', { align: 'center' });
        doc.moveDown();

        doc.fontSize(12).text(`Toplam Sensör Sayısı: ${reportData.totalSensors}`);
        doc.text(`Aktif Sensör Sayısı: ${reportData.activeSensorsLen}`);
        doc.text(`Pasif Sensör Sayısı: ${reportData.passiveSensorsLen}`);
        doc.moveDown();

        // Aktif sensörler
        if (reportData.activeSensors.length > 0) {
            doc.fontSize(14).text('Aktif Sensörler:', { underline: true });
            reportData.activeSensors.forEach((sensor, index) => {
                doc.fontSize(12).text(`${index + 1}. ${sensor.name} (Kod: ${sensor.datacode}, Tür: ${sensor.type})`);
            });
            doc.moveDown();
        }

        // Pasif sensörler
        if (reportData.passiveSensors.length > 0) {
            doc.fontSize(14).text('Pasif Sensörler:', { underline: true });
            reportData.passiveSensors.forEach((sensor, index) => {
                doc.fontSize(12).text(`${index + 1}. ${sensor.name} (Kod: ${sensor.datacode}, Tür: ${sensor.type})`);
            });
            doc.moveDown();
        }

        // Oluşturulma tarihi
        doc.fontSize(10).text(`Rapor Oluşturulma Tarihi: ${new Date().toLocaleString('tr-TR')}`, { align: 'right' });

        doc.end();

        // Dosyanın başarılı bir şekilde yazıldığını kontrol et
        await new Promise((resolve, reject) => {
            stream.on('finish', resolve);
            stream.on('error', reject);
        });

        console.log(`PDF başarıyla oluşturuldu: ${filePath}`);
        return filePath;
    } catch (error) {
        console.error('PDF oluşturulurken hata oluştu:', error);
        throw new Error('PDF raporu oluşturulamadı.');
    }
}


/**
 * Kullanıcı Durumu için PDF Raporu Oluşturma
 * @param {Object} reportData - Aktif ve pasif kullanıcı verilerini içeren rapor verisi
 * @returns {Promise<string>} - Oluşturulan dosyanın yolu
 */
async function generatePDFReportIsActive(reportData) {
    try {
        const desktopPath = path.join(os.homedir(), 'Desktop'); // Desktop path

        if (!fs.existsSync(desktopPath)) {
            fs.mkdirSync(desktopPath, { recursive: true });
        }

        const fileName = `ActiveUsersReport_${Date.now()}.pdf`;
        const filePath = path.join(desktopPath, fileName);

        const doc = new PDFDocument({ size: 'A4', margin: 40 });

        // Türkçe destekli fontu yükle
        const fontPath = path.join(__dirname, '../fonts/DejaVuSans.ttf');
        if (!fs.existsSync(fontPath)) {
            throw new Error(`Font dosyası bulunamadı: ${fontPath}`);
        }
        doc.registerFont('TurkishFont', fontPath);
        doc.font('TurkishFont');

        // PDF yazma işlemine başla
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Başlık
        doc.fontSize(20).text('Kullanıcı Durum Raporu', { align: 'center' });
        doc.moveDown();

        // Aktif Kullanıcılar
        doc.fontSize(14).text(`Aktif Kullanıcı Sayısı: ${reportData.activeUsersLen}`, { underline: true });
        reportData.activeUsers.forEach((user, index) => {
            doc.fontSize(12).text(`${index + 1}. İsim: ${user.dataValues.name || 'Bilinmiyor'}`);
        });
        doc.moveDown();

        // Pasif Kullanıcılar
        doc.fontSize(14).text(`Pasif Kullanıcı Sayısı: ${reportData.passiveUsersLen}`, { underline: true });
        reportData.passiveUsers.forEach((user, index) => {
            doc.fontSize(12).text(`${index + 1}. İsim: ${user.dataValues.name || 'Bilinmiyor'}`);
        });

        // Rapor oluşturulma tarihini ekle
        doc.moveDown();
        doc.fontSize(10).text(`Rapor Tarihi: ${new Date().toLocaleString('tr-TR')}`, { align: 'right' });

        doc.end();

        await new Promise((resolve, reject) => {
            stream.on('finish', resolve);
            stream.on('error', reject);
        });

        console.log(`PDF başarıyla oluşturuldu: ${filePath}`);
        return filePath;
    } catch (error) {
        console.error('PDF oluşturulurken hata oluştu:', error);
        throw new Error('PDF raporu oluşturulamadı.');
    }
}

async function generatePDFReportCompanies(companies) {
    try {
        const desktopPath = path.join(os.homedir(), 'Desktop'); // Desktop path

        if (!fs.existsSync(desktopPath)) {
            fs.mkdirSync(desktopPath, { recursive: true });
        }

        const fileName = `CompaniesReport_${Date.now()}.pdf`;
        const filePath = path.join(desktopPath, fileName);

        const doc = new PDFDocument({ size: 'A4', margin: 40 });

        // Türkçe destekli font yükle
        const fontPath = path.join(__dirname, '../fonts/DejaVuSans.ttf');
        if (!fs.existsSync(fontPath)) {
            throw new Error(`Font dosyası bulunamadı: ${fontPath}`);
        }
        doc.registerFont('TurkishFont', fontPath);
        doc.font('TurkishFont');

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Başlık
        doc.fontSize(20).text('Şirket Raporu', { align: 'center' });
        doc.moveDown();

        // Genel Bilgiler
        doc.fontSize(14).text(`Toplam Şirket Sayısı: ${companies.length}`, { underline: true });
        companies.forEach((company, index) => {
            doc.fontSize(12).text(
                `${index + 1}. Şirket: ${company.name || 'Bilinmiyor'} (Kod: ${company.code}, Plaka: ${company.plate}, Aktif: ${company.isActive ? 'Evet' : 'Hayır'})`
            );
        });

        doc.moveDown();

        // Rapor oluşturulma tarihini ekle
        doc.fontSize(10).text(`Rapor Tarihi: ${new Date().toLocaleString('tr-TR')}`, { align: 'right' });

        doc.end();

        // PDF tamamlandıktan sonra yazma işlemi
        await new Promise((resolve, reject) => {
            stream.on('finish', resolve);
            stream.on('error', reject);
        });

        console.log(`PDF başarıyla oluşturuldu: ${filePath}`);
        return filePath;
    } catch (error) {
        console.error('PDF oluşturulurken hata oluştu:', error);
        throw new Error('PDF raporu oluşturulamadı.');
    }
}


async function generatePDFReportTypeClass(groupedSensors, groupedLengths, types) {
    const desktopPath = path.join(os.homedir(), "Desktop");

    if (!fs.existsSync(desktopPath)) {
        fs.mkdirSync(desktopPath, { recursive: true });
    }

    const filePath = path.join(desktopPath, `SensorTipRaporu_${Date.now()}.pdf`);
    const doc = new PDFDocument({ size: "A4", margin: 40 });

    // Türkçe fontu yükle
    const fontPath = path.join(__dirname, "../fonts/DejaVuSans.ttf");
    if (!fs.existsSync(fontPath)) {
        throw new Error("Türkçe font dosyası bulunamadı!");
    }
    doc.registerFont("TurkishFont", fontPath);
    doc.font("TurkishFont");

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Başlık
    doc.fontSize(20).text("Sensör Tip Raporu", { align: "center" });
    doc.moveDown();

    // Sensör gruplarını yazdır
    Object.keys(groupedSensors).forEach((type) => {
        const typeName = types && types.find((t) => t.id == type)?.type || "Bilinmiyor";
        doc.fontSize(14).text(`${typeName} (${groupedLengths[type]} sensör):`, { underline: true });
        groupedSensors[type].forEach((sensor, index) => {
            doc.fontSize(12).text(
                `${index + 1}. Kod: ${sensor.datacode}, İsim: ${sensor.name}, Konum: (${sensor.lat}, ${sensor.lng})`
            );
        });
        doc.moveDown();
    });

    doc.end();

    await new Promise((resolve, reject) => {
        stream.on("finish", resolve);
        stream.on("error", reject);
    });

    console.log(`Türkçe destekli PDF başarıyla oluşturuldu: ${filePath}`);
    return filePath;
}


/**
 * Şirketlere göre sensörlerin PDF raporunu oluşturur.
 */
const generatePdfReportCompanyStats = async (groupedLengths, companies, groupedCompany) => {
    const desktopPath = path.join(os.homedir(), "Desktop");

    if (!fs.existsSync(desktopPath)) {
        fs.mkdirSync(desktopPath, { recursive: true });
    }

    const filePath = path.join(desktopPath, `SirketSensörRaporu_${Date.now()}.pdf`);
    const doc = new PDFDocument({ size: "A4", margin: 40 });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(20).text("Şirketlere Göre Sensör Raporu", { align: "center" });
    doc.moveDown();

    companies.forEach(company => {
        const sensors = groupedCompany[company.code] || [];

        doc.fontSize(14).text(`${company.name} (${company.code})`, { underline: true });
        doc.fontSize(12).text(`Toplam Sensör Sayısı: ${groupedLengths[company.code] || 0}`);
        sensors.forEach((sensor, index) => {
            doc.text(`  ${index + 1}. ${sensor.name} (Kod: ${sensor.datacode}, Tür: ${sensor.type}, Aktif: ${sensor.isActive ? "Evet" : "Hayır"})`);
        });
        doc.moveDown();
    });

    doc.text(`Rapor Tarihi: ${new Date().toLocaleString("tr-TR")}`, { align: "right" });
    doc.end();
    await new Promise((resolve, reject) => {
        stream.on("finish", resolve);
        stream.on("error", reject);
    });
    return filePath;
};


// Log verilerini PDF formatında oluşturma

const generatePDFSensorLog = async (details = {}, summary = {}) => {
    const desktopPath = path.join(os.homedir(), "Desktop");

    if (!fs.existsSync(desktopPath)) {
        fs.mkdirSync(desktopPath, { recursive: true });
    }

    const filePath = path.join(desktopPath, `SensörLogRaporu_${Date.now()}.pdf`);

    const doc = new PDFDocument();

    // PDF kaydetme işlemi
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // DejaVuSans yazı tipi yükleme
    const fontPath = path.join(__dirname, "../fonts/DejaVuSans.ttf");
    if (fs.existsSync(fontPath)) {
        doc.font(fontPath);
    } else {
        throw new Error("DejaVuSans yazı tipi bulunamadı.");
    }

    // Başlık
    doc.fontSize(20).text("Sensör Log Raporu", { align: "center" });
    doc.moveDown();

    // Özet Bilgiler (logs.summary)
    doc.fontSize(16).text("Özet Bilgiler");
    if (Object.keys(summary).length === 0) {
        doc.fontSize(12).text("Özet bilgisi bulunmamaktadır.");
    } else {
        Object.entries(summary).forEach(([category, count]) => {
            doc.fontSize(12).text(`${category}: ${count}`);
        });
    }

    doc.moveDown();

    // Detay Bilgiler (logs.details)
    doc.fontSize(16).text("Detaylar");
    if (Object.keys(details).length === 0) {
        doc.fontSize(12).text("Detay bilgisi bulunmamaktadır.");
    } else {
        Object.entries(details).forEach(([category, logs]) => {
            doc.fontSize(14).text(`Kategori: ${category}`);
            logs.forEach((log) => {
                const timestamp = new Date(log.timestamp).toLocaleString("tr-TR");
                doc.fontSize(10).text(
                    `- ID: ${log.id}, Sensör Adı: ${log.sensorName}, Aksiyon: ${log.action}, Tarih: ${timestamp}`
                );
                doc.fontSize(12).text(`  Eski Veri: ${log.oldData}`);
                doc.fontSize(12).text(`  Yeni Veri: ${log.newData}`);
                doc.moveDown(0.5);
            });
            doc.moveDown();
        });
    }

    doc.end();

    await new Promise((resolve, reject) => {
        stream.on("finish", resolve);
        stream.on("error", reject);
    });

    return filePath;
};





module.exports = {
    generateReportTotalSensors,
    generatePDFReportIsActive,
    generatePDFReportCompanies,
    generatePDFReportTypeClass,
    generatePdfReportCompanyStats,
    generatePDFSensorLog,
};
