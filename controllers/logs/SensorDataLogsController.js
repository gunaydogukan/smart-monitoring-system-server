const {getAllSensors} = require("../../services/sensorServices"); //sensor bilgilerini alacağımız services
const sensorData = require('../../models/sensors/SensorsData');
const {SensorData} = require("../../models/sensors/SensorsData"); // ip log modeli
const moment = require('moment');
const sequelize = require("../../config/sensorDatadatabase");
const Sequelize = require("sequelize"); //zaman hesabı için kullanılır

const checkSensorDataTimestamp = async (req,res) =>{
    // erişim denetimi kontrolü yapılmadı. düşünülmedi İŞLEM BİTİNCE BAK KONTROL ET
    try{
        const allSensors=await getAllSensors();
        const datacodeList = allSensors.sensors.map(sensor => sensor.datacode); //tüm sensörlerin datacodeleri alındı

        //zaman kontrolü yapan metota gönderme
        for(const datacode of datacodeList){
            const time = await checkSensorTime(datacode);

        }
    }catch (err){
        console.error("hata checkSensorDataTimestamp METOTU");
        return res.status(500).json({ message: "checkSensorDataTimestamp METOTU", error: err.message });
    }


}

const checkSensorTime = async (datacode) =>{
    try{
        console.log(`Kontrol edilen sensör = ${datacode}`);
        //datacoda'a göre sensör table' ulaşıyoruz dinamik oldugu için
        const sensorDataTable = await SensorData(datacode);

        console.log("sensör bulundu : "+sensorDataTable);

        const lastSensorData = await sensorDataTable.findOne({
            order: [['time','DESC']],
            limit:1
        });

        if(!lastSensorData){
            console.log(`${datacode} koduna sahip sensör için veri bulunamadı.`);
            return null;
        }

        const lastDataTime = moment(lastSensorData.time); // Son verinin zamanını `time` kolonundan alıyoruz
        const currentTime = moment(new Date());

        //zaman farkları alınır dakika cinsinden
        const diffMinutes  = currentTime.diff(lastDataTime, 'minutes');

        return diffMinutes ;

    }catch (e) {
        console.log("hata = checkSensorTime metotu");
        throw new Error("checkSensorTime metodu hatası");
    }
}

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

module.exports = {checkSensorDataTimestamp};

