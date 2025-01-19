const fs = require('fs');
const path = require('path');
const pdf = require('../services/createPDF');
const excel = require('../services/createExcel');
const sensorServices = require('../services/sensorServices');
const userServices = require('../services/userServices');
const companyServices = require('../services/companyServices');
const getTotalSensors = async (req, res) => {
    try {
        const reportType = req.query.reportType; // Rapor tipi kontrolü
        const user = req.user;

        if (!user) {
            return res.status(403).json({ error: "Bu işlemi yapmak için yetkiniz yok." });
        }

        // Sensör verilerini hazırla
        let sensors;
        let sensorsLen;
        const activeSensors = [];
        const passiveSensors = [];
        let activeCount = 0;
        let passiveCount = 0;

        if (user.role === "administrator") {
            const allSensors = await sensorServices.getAllSensors();
            sensors = allSensors.sensors || [];
            sensorsLen = sensors.length;
        } else {
            const sensorsIds = await sensorServices.getSensorIdsByOwner(user.id);
            sensorsLen = sensorsIds.length;
            sensors = await sensorServices.getSensorsByIds(sensorsIds);
        }

        if (!sensors || sensors.length === 0) {
            return res.status(200).json({ totalSensors: 0,
                activeSensorsLen: 0,
                passiveSensorsLen: 0,
                activeSensors,
                passiveSensors,
                sensors, });
        }

        sensors.forEach(sensor => {
            if (sensor.isActive) {
                activeSensors.push(sensor);
                activeCount += 1;
            } else {
                passiveSensors.push(sensor);
                passiveCount += 1;
            }
        });

        const result = {
            totalSensors: sensorsLen,
            activeSensorsLen: activeCount,
            passiveSensorsLen: passiveCount,
            activeSensors,
            passiveSensors,
            sensors,
        };

        // Eğer rapor tipi belirtilmişse, rapor oluştur ve indir
        if (reportType) {
            if (reportType === "pdf") {
                const filePath = await pdf.generateReportTotalSensors(result);

                if (!fs.existsSync(filePath)) {
                    return res.status(500).json({ error: "PDF dosyası bulunamadı." });
                }

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename="TumSensorlerinRaporu.pdf"');
                return res.sendFile(filePath);
            }

            if (reportType === "excel") {
                const filePath = await excel.generateExcelReportTotalSensors(result);

                if (!fs.existsSync(filePath)) {
                    return res.status(500).json({ error: "Excel dosyası bulunamadı." });
                }

                res.setHeader(
                    'Content-Type',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                );
                res.setHeader('Content-Disposition', 'attachment; filename="TumSensorlerinRaporu.xlsx"');
                return res.sendFile(filePath);
            }

            return res.status(400).json({ error: "Geçersiz rapor türü. 'pdf' veya 'excel' olmalıdır." });
        }

        // Eğer rapor tipi belirtilmemişse, sensör verilerini döndür
        return res.status(200).json(result);
    } catch (error) {
        console.error("getTotalSensors hata:", error.message, error.stack);
        return res.status(500).json({ error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." });
    }
};


//kullancıların aktif pasif sorgusunu yapar (manager ve admin içn)
const getIsActive = async (req, res) => {
    try {
        const user = req.user;
        const reportType = req.query.reportType;

        if (!user || user.role === "personal") {
            return res.status(403).json({ error: "Bu işlemi yapmak için yetkiniz yok." });
        }

        // Kullanıcıları al ve gruplandır
        const users = await userServices.getUsers(user.id, user.role);
        const activeUsers = users.filter(u => u.dataValues.isActive === true);
        const passiveUsers = users.filter(u => u.dataValues.isActive === false);

        const reportData = {
            totalUsers: users.length,
            activeUsersLen: activeUsers.length,
            passiveUsersLen: passiveUsers.length,
            activeUsers,
            passiveUsers,
        };

        // Eğer rapor tipi belirtilmişse raporu oluştur ve indir
        if (reportType) {
            let filePath;

            if (reportType === "pdf") {
                filePath = await pdf.generatePDFReportIsActive(reportData);
                if (!fs.existsSync(filePath)) {
                    return res.status(500).json({ error: "PDF dosyası bulunamadı." });
                }

                res.setHeader("Content-Type", "application/pdf");
                res.setHeader("Content-Disposition", "attachment; filename=KullancilarRaporu.pdf");
                return res.sendFile(filePath);
            }

            if (reportType === "excel") {
                filePath = await excel.generateExcelReportIsActive(reportData);
                if (!fs.existsSync(filePath)) {
                    return res.status(500).json({ error: "Excel dosyası bulunamadı." });
                }

                res.setHeader(
                    "Content-Type",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                );
                res.setHeader("Content-Disposition", "attachment; filename=KullancilarRaporu.xlsx");
                return res.sendFile(filePath);
            }

            return res.status(400).json({ error: "Geçersiz rapor türü. 'pdf' veya 'excel' olmalıdır." });
        }

        // Eğer rapor tipi belirtilmemişse veriyi döndür
        return res.status(200).json(reportData);
    } catch (error) {
        console.error("getIsActive hata:", error.message, error.stack);
        return res.status(500).json({ error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." });
    }
};


//toplam kurum sayısı(sadece admin için görülür)
const getAllCompanies = async (req, res) => {
    try {
        const user = req.user;
        const reportType = req.query.reportType;

        if (!user || user.role === "manager" || user.role === "personal") {
            return res.status(403).json({ error: "Bu işlemi yapmak için yetkiniz yok." });
        }

        // Tüm şirketleri al
        const companies = await companyServices.getAllCompanies();

        if (!companies || companies.length === 0) {
            return res.status(404).json({ error: "Hiçbir şirket bulunamadı." });
        }

        // Eğer rapor tipi belirtilmişse, rapor oluştur ve indir
        if (reportType) {
            let filePath;

            if (reportType === "pdf") {
                filePath = await pdf.generatePDFReportCompanies(companies);
                if (!fs.existsSync(filePath)) {
                    return res.status(500).json({ error: "PDF dosyası bulunamadı." });
                }

                res.setHeader("Content-Type", "application/pdf");
                res.setHeader("Content-Disposition", "attachment; filename=SirketlerRaporu.pdf");
                return res.sendFile(filePath);
            }

            if (reportType === "excel") {
                filePath = await excel.generateExcelReportCompanies(companies);
                if (!fs.existsSync(filePath)) {
                    return res.status(500).json({ error: "Excel dosyası bulunamadı." });
                }

                res.setHeader(
                    "Content-Type",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                );
                res.setHeader("Content-Disposition", "attachment; filename=SirketlerRaporu.xlsx");
                return res.sendFile(filePath);
            }

            return res.status(400).json({ error: "Geçersiz rapor türü. 'pdf' veya 'excel' olmalıdır." });
        }

        // Eğer rapor tipi belirtilmemişse, JSON formatında veri döndür
        return res.status(200).json({ companyLen: companies.length, companies });
    } catch (error) {
        console.error("getAllCompanies hata:", error.message, error.stack);
        return res.status(500).json({ error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." });
    }
};


//sensör tiplerine göre dağılım yapma fonksoynu
const getSensorsTypesCount = async (req, res) => {
    try {
        const user = req.user;
        const reportType = req.query.reportType;

        if (!user) {
            return res.status(403).json({ error: "Bu işlemi yapmak için yetkiniz yok." });
        }

        let sensors;
        if (user.role === "administrator") {
            sensors = (await sensorServices.getAllSensors()).sensors;
        } else {
            const sensorsIds = await sensorServices.getSensorIdsByOwner(user.id);
            sensors = await sensorServices.getSensorsByIds(sensorsIds);
        }

        const types = await sensorServices.getTypes();
        const groupedSensors = {};
        const groupedLengths = {};

        sensors.forEach((sensor) => {
            const type = sensor.dataValues?.type || "Unknown";
            if (!groupedSensors[type]) {
                groupedSensors[type] = [];
                groupedLengths[type] = 0;
            }
            groupedSensors[type].push(sensor.dataValues);
            groupedLengths[type] += 1;
        });

        if (reportType) {
            const filePath =
                reportType === "pdf"
                    ? await pdf.generatePDFReportTypeClass(groupedSensors, groupedLengths, types)
                    : await excel.generateExcelReportTypeClass(groupedSensors, groupedLengths, types);

            if (!fs.existsSync(filePath)) {
                return res.status(500).json({ error: `${reportType.toUpperCase()} dosyası bulunamadı.` });
            }

            const fileName = reportType === "pdf" ? "SensorTipRaporu.pdf" : "SensorTipRaporu.xlsx";
            res.setHeader(
                "Content-Type",
                reportType === "pdf"
                    ? "application/pdf"
                    : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
            return res.sendFile(filePath);
        }

        return res.status(200).json({ groupedLengths, groupedSensors, types });
    } catch (error) {
        console.error("getSensorsTypesCount hata:", error.message, error.stack);
        return res.status(500).json({ error: "Beklenmeyen bir hata oluştu." });
    }
};


//kurumlara göre sensör dağılımı
const getCompanySensorStats = async (req, res) => {
    try {
        const user = req.user;
        const reportType = req.query.reportType;

        if (!user || (user.role === "manager" || user.role === "personal")) {
            return res.status(403).json({ error: "Bu işlemi yapmak için yetkiniz yok." });
        }

        const companies = await companyServices.getAllCompanies();
        const sensors = (await sensorServices.getAllSensors()).sensors;

        if (!sensors || !companies) {
            return res.status(404).json({ error: "Şirket veya sensör bilgisi alınamadı." });
        }

        const groupedCompany = {};
        const groupedLengths = {};

        sensors.forEach(sensor => {
            const companyCode = sensor.company_code;

            if (!groupedCompany[companyCode]) {
                groupedCompany[companyCode] = [];
                groupedLengths[companyCode] = 0;
            }
            groupedCompany[companyCode].push(sensor);
            groupedLengths[companyCode]++;
        });

        if (reportType) {
            try {
                const filePath =
                    reportType === "pdf"
                        ? await pdf.generatePdfReportCompanyStats(groupedLengths, companies, groupedCompany)
                        : await excel.generateExcelReportCompanyStats(groupedLengths, companies, groupedCompany);

                if (!fs.existsSync(filePath)) {
                    return res.status(500).json({ error: `${reportType.toUpperCase()} dosyası bulunamadı.` });
                }

                const fileName = reportType === "pdf" ? "SirketSensörRaporu.pdf" : "SirketSensörRaporu.xlsx";
                res.setHeader(
                    "Content-Type",
                    reportType === "pdf"
                        ? "application/pdf"
                        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                );
                res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
                return res.sendFile(filePath);
            } catch (err) {
                console.error("Rapor oluşturulamadı:", err);
                return res.status(500).json({ error: `Rapor oluşturulamadı: ${err.message}` });
            }
        }

        return res.status(200).json({ groupedLengths, companies, groupedCompany });
    } catch (error) {
        console.error("getCompanySensorStats hata:", error.message);
        return res.status(500).json({ error: "Beklenmeyen bir hata oluştu." });
    }
};

//sensor loglarını getirir actiona göre
const getSensorLogToAction = async (req, res) => {
    const user = req.user;
    const reportType = req.query.reportType || req.params.reportType;
    if (!user) {
        return res.status(403).json({ error: "Bu işlemi yapmak için yetkiniz yok." });
    }

    const { action } = req.query;
    if (!action) {
        return res.status(400).json({ error: "Lütfen geçerli bir 'action' değeri gönderin." });
    }

    try {
        const logs = await sensorServices.getSensorLog(user.id, user.role, action);

        if (logs.length === 0) {
            return res.status(404).json({ message: "Belirtilen 'action' değeriyle eşleşen log bulunamadı." });
        }

        // Rapor oluşturma kontrolü
        if (reportType) {
            try {
                let filePath;

                // Rapor türüne göre dosya oluştur
                switch (reportType.toLowerCase()) {
                    case "pdf":
                        filePath = await pdf.generatePDFSensorLog(logs); // `logs` parametresini ilet
                        break;
                    case "excel":
                        filePath = await excel.generateExcelSensorLog(logs); // `logs` parametresini ilet
                        break;
                    default:
                        return res.status(400).json({ error: "Geçersiz rapor türü. 'pdf' veya 'excel' olmalıdır." });
                }

                return res.status(200).json({
                    message: "Rapor başarıyla oluşturuldu.",
                    filePath,
                });
            } catch (err) {
                return res.status(500).json({
                    error: `Rapor oluşturulamadı: ${err.message}`,
                });
            }
        }

        return res.status(200).json({
            message: `Action '${action}' için loglar başarıyla getirildi.`,
            logs,
        });
    } catch (error) {
        console.error("Hata:", error);
        return res.status(500).json({
            error: "Loglar getirilirken bir hata oluştu.",
            details: error.message,
        });
    }
};

const getSensorLog = async (req, res) => {
    try {
        const user = req.user;
        const reportType = req.query.reportType;

        if (!user || user.role!=="administrator") {
            return res.status(403).json({ error: "Bu işlemi yapmak için yetkiniz yok." });
        }

        const logs = await sensorServices.getSensorLog(user.id, user.role);

        if (!logs || (!logs.summary && !logs.details)) {
            return res.status(404).json({ message: "Log bulunamadı." });
        }

        if (reportType) {
            try {
                let filePath;
                if (reportType === "pdf") {
                    filePath =filePath = await pdf.generatePDFSensorLog(logs.details, logs.summary);
                } else if (reportType === "excel") {
                    filePath = await excel.generateExcelSensorLog(logs);
                } else {
                    throw new Error("Geçersiz rapor türü.");
                }

                const absolutePath = path.resolve(filePath);
                const fileName = path.basename(filePath);
                res.setHeader(
                    "Content-Type",
                    reportType === "pdf"
                        ? "application/pdf"
                        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                );
                res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
                return res.sendFile(absolutePath);
            } catch (err) {
                console.error("Rapor oluşturulamadı:", err.message);
                return res.status(500).json({ error: `Rapor oluşturulamadı: ${err.message}` });
            }
        }

        return res.status(200).json({ success: true, logs });
    } catch (error) {
        console.error("getSensorLog hata:", error.message);
        return res.status(500).json({ error: "Beklenmeyen bir hata oluştu." });
    }
};

const getUserLog = async (req, res) => {
    try {
        const user = req.user;

        if (!user || user.role!=="administrator") {
            return res.status(403).json({ error: "Bu işlemi yapmak için yetkiniz yok." });
        }

        const { groupedLogs } = await sensorServices.getUserLog(user.id, user.role);

        if (!groupedLogs) {
            return res.status(404).json({ message: "Log bulunamadı." });
        }

        // Gereksiz katmanları kaldırarak daha okunaklı bir yapı oluştur
        const { logs, summary } = groupedLogs;

        return res.status(200).json({
            success: true,
            summary: summary, // İşlem türlerine göre özet
            logs: logs, // Detaylı loglar
        });
    } catch (error) {
        console.error("getSensorLog hata:", error.message);
        return res.status(500).json({ error: "Beklenmeyen bir hata oluştu." });
    }
};



module.exports={getTotalSensors,getIsActive,getAllCompanies,getSensorsTypesCount,getCompanySensorStats,getSensorLog,getSensorLogToAction,getUserLog};