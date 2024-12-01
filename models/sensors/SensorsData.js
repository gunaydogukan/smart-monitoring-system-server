const Sequelize = require('sequelize');
const sequelize = require('../../config/sensorDatadatabase');
const Type = require("../../models/sensors/SensorTypes");

//Buradaki tablo sensor_data ' databesine bağlantı oluşurup oraya kaydediyor.
// Dinamik sensör data table oluşturma
const SensorData = async (sensor) => {
    try{
        //sensor bilgisi kontrolü
        if(!sensor){
            console.log("sensör bulunamadı, SensorData Modelinde ");
            throw new Error("Sensör bulunamadı");
        }
        console.log("GELEN SENSÖR: ",sensor)
        // Sensör tipi kontrolü
        const sensorType = await Type.findOne({ where: { id: sensor.type } }); // ID'ye göre arama yapıyoruz
        console.log("Sensör tipi: ", sensorType);

        console.log("Sensmr tyoe = ",sensorType);
        if(!sensorType){
            console.log("Sensör tipi bulunamadı");
            throw new Error("Sensör tipi bulunamadı.");
        }

        let dataNamesArray = [];
        try {
            dataNamesArray = JSON.parse(sensorType.dataNames); // JSON stringi diziye dönüştür
        } catch (error) {
            console.log("JSON.parse hatası: ", error);
            throw new Error("Sensör tipi 'dataNames' formatı hatalı.");
        }

        const { dataCount } = sensorType;

        if (!Array.isArray(dataNamesArray) || dataNamesArray.length !== dataCount) {
            console.log("TYPE KONTROLÜNDE PROBLEM , SENSORDATA MODELİ");
            throw new Error("Sensör tipi verileri eksik veya hatalı.");
        }

        // Tablo oluşturma alanı
        const tableFields = {};

        // dataNames arrayindeki her isim için sütun ekleme alanı
        dataNamesArray.forEach((columnName) => {
            tableFields[columnName] = {
                type: Sequelize.FLOAT,
                allowNull: false,
            };
        });

        tableFields.time = {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        };

        // Dinamik tablo adını belirleme alanı
        const tableName = sensor.datacode;

        // Dinamik tabloyu oluştur
        const SensorDataTable = sequelize.define(tableName, tableFields, {
            timestamps: false,
            freezeTableName: true,
        });

        // Eğer tablo yoksa oluştur
        await SensorDataTable.sync();
        console.log(`${tableName} tablosu başarıyla oluşturuldu.`);
        return SensorDataTable;

    }catch (err){
        console.log("SensorData table oluşturulamadı, SensorData Modelinde",err.message);
        throw err;
    }
};



module.exports = { SensorData};
