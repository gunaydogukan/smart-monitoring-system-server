const Sequelize = require('sequelize');
const sequelize = require('../../config/sensorDatadatabase');

//Buradaki tablo sensor_data ' databesine bağlantı oluşurup oraya kaydediyor.
// Dinamik sensör data table oluşturma
const SensorData = async (sensor) => {
    const tableName = `${sensor.datacode}`;

    // Sensör tipine göre tablo yapısı belirleniyor

    const tableFields = sensor.type === 1 ? { //Sıcaklık

        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true // id otomatik artan olsun
        },
        sagUstNem: { type: Sequelize.FLOAT, allowNull: false },
        sagUstSıcaklık: { type: Sequelize.FLOAT, allowNull: false },
        sagAltNem: { type: Sequelize.FLOAT, allowNull: false },
        sagAltSıcaklık: { type: Sequelize.FLOAT, allowNull: false },
        solAltNem: { type: Sequelize.FLOAT, allowNull: false },
        solAltSıcaklık: { type: Sequelize.FLOAT, allowNull: false },
        time: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')}, // Tarih ve saat tek alan
    } : sensor.type === 2 ? { // Mesafe
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true // id otomatik artan olsun
        },
        distance: { type: Sequelize.FLOAT, allowNull: false },
        time: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }, // Tarih ve saat tek alan
    }: sensor.type === 3 ? { //yağmur
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true // id otomatik artan olsun
        },
        rainFall: { type: Sequelize.FLOAT, allowNull: false },
        datetime: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }, // Tarih ve saat tek alan
    } :{  //eğer yeni sensör type eklenirse onun için oluşturulacak olan table
      id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true // id otomatik artan olsun
      },
      value: { type: Sequelize.FLOAT, allowNull: false },
      time: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }, // Tarih ve saat tek alan , Otomatik tarih ve saat ekleniyor
    } ; // Eğer `sensor.type` hiçbirine uymuyorsa `null` döndür

    // Dinamik tabloyu oluştur
    const SensorDataTable = sequelize.define(tableName, tableFields, {
        timestamps: false, // createdAt, updatedAt gibi alanlar olmaması için
        freezeTableName: true, // Tablonun isminin değiştirilmesini engelle
    });
    // Eğer tablo yoksa oluşturuluyor
    await SensorDataTable.sync();
    return SensorDataTable;
};


module.exports = { SensorData };
