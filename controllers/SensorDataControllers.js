const sequelize = require("../config/sensorDatadatabase");
const Sequelize = require("sequelize");


const getSensorData = async (req, res) => {
    const { dataCode } = req.query; // Url'den gelen dataCode'yi alır
    console.log("Gelen dataCode:", dataCode);

    if(!dataCode){ //DATACODE YOKSA
        return res.status(400).json({ error: 'DataCode bulunamadı' });
    }

    // dataCode'u küçük harfe çeviriyoruz
    const code = dataCode.toLowerCase();
    try {

        let data = await findTable(code);

        //data = await .findAll();
        console.log(data);
        res.json(data); //json formatında  yanıt döndür

    } catch (error) {
        console.error("Veri çekme hatası:", error);
        res.status(500).json({ error: "Veri çekme hatası" });
    }
};

const findTable = async (code)=>{ //GET SENSORDATA İÇİN KULLANILIYOR
    const tableName = code;

    try {
        //tabloyu bulma
        const result = await sequelize.query(
            `SELECT * FROM ${tableName}`,
            {
                type: Sequelize.QueryTypes.SELECT,
            }
        );
        return result; // Sorgu sonuçlarını döndür
    } catch (error) {
        console.error('Sorgu yapılırken hata:', error);
        return null; // Hata durumu
    }
};

module.exports = {getSensorData};

