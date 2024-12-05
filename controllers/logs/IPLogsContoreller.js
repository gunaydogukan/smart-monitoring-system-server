const IpLog = require('../../models/logs/IPLog'); // ip log modeli

const updateIpLog = async (req, res) => {
    try {
        //DEĞİŞECEK

        const { ipAdress, datacode } = req.body;

        if (!ipAdress || !datacode) {
            return res.status(400).json({ message: "İp adresi veya datacode bulunamadı, bunlar gerekli." });
        }

        const log = await IpLog.findOne({ where: { datacode } });

        if (!log) {
            return res.status(404).json({ message: "Alınan datacode ile eşleşen bir kayıt bulunamadı." });
        }

        const newDate = new Date();
        const prevIp = log.IP_Adresses;
        let newData = {};

        // Eğer IP adresi yoksa yeni IP adresi eklenir
        if (!prevIp) {
            newData = {
                IP_Adresses: ipAdress,
                updatedAt: newDate,
            };
        }
        else {
            //IP DEĞİŞEBİLİR Mİ ONA GÖRE DEĞİŞİKLİK YAPABİLİRİZ ? SOR
            // Eğer IP adresi varsa, sadece zamanı güncelleriz
            newData = {
                IP_Adresses: prevIp, // önceki IP adresi
                updatedAt: newDate,
            };
        }

        await IpLog.update(newData, { where: { datacode } });

        return res.status(200).json({
            message: "IP adresi güncellendi ve zaman güncellendi.",
            data: {
                datacode: datacode,
                IP_Adresses: newData.IP_Adresses,
                updatedAt: newData.updatedAt,
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "updateIpLog metodu hatası", error: error.message });
    }
};

const getIpLogs = async (req, res) => {
    try {
        const { datacodes } = req.query;

        if (!datacodes) {
            return res.status(400).json({ message: 'Datacode parametresi eksik.' });
        }

        const dataCodesArray = datacodes.split(',');

        const ipLogs = await IpLog.findAll({
            where: {
                datacode: dataCodesArray,
            },
        });
        console.log(ipLogs);

        return res.status(200).json({ message: 'IP Logları başarıyla alındı.', data: ipLogs });
    } catch (err) {
        console.error('Hata: IPLOGSCONTROLLER GETIPLOGS', err);
        return res.status(500).json({ message: 'IP Logları alınırken bir hata oluştu.', error: err });
    }
};

module.exports = { updateIpLog,getIpLogs };
