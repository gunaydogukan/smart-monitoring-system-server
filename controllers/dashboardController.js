const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const sensorServices = require('../services/sensorServices');
const userServices = require('../services/userServices');
const companyServices = require ('../services/companyServices');

//manager ile girdiğinde managerea it olan personellerin sensörlerini böl yapılabilir...
const getTotalSensors = async (req,res) => {
    const user = req.user;
    if(!user){
        return res.status(403).json({ error: "Bu işlemi yapmak için yetkiniz yok." });
    }

    let sensors;
    let sensorsLen;
    const activeSensors = [];
    const passiveSensors = [];
    let activeCount = 0;
    let passiveCount = 0;
    //kullanıcı eğer admin ise tüm sensörler gelir
    if(user.role==="administrator"){
        sensors=await sensorServices.getAllSensors();
        sensors= sensors.sensors;
        sensorsLen=sensors.length;
    }else{
        const sensorsIds = await sensorServices.getSensorIdsByOwner(user.id); //kişinin kendisine ait sensörlerinin id'si gelir
        sensorsLen = sensorsIds.length ;
        sensors = await sensorServices.getSensorsByIds(sensorsIds.sensor_id);
    }

    if(sensors == null){
        return res.status(400).json({ error: "Veri bulunamadı" });
    }

    // Sensörlerin aktif ve pasif durumlarını ayırma
    sensors.forEach(sensor => {
        if (sensor.isActive) {
            activeSensors.push(sensor); // Aktif sensörü listeye ekle
            activeCount += 1;          // Aktif sayaç artır
        } else {
            passiveSensors.push(sensor); // Pasif sensörü listeye ekle
            passiveCount += 1;          // Pasif sayaç artır
        }
    });

    return res.status(200).json({
        totalSensors: sensorsLen,
        activeSensorsLen: activeCount,
        passiveSensorsLen: passiveCount,
        activeSensors:activeSensors,
        passiveSensors:passiveSensors,
        sensors:sensors
    });
}

//kullancıların aktif pasif sorgusunu yapar (manager ve admin içn)
const getIsActive = async (req,res) => {
    const user = req.user;
    if(!user || user.role==="personal"){
        return res.status(403).json({ error: "Bu işlemi yapmak için yetkiniz yok." });
    }

    const usr = await userServices.getUsers(user.id,user.role); //role göre kullanıcıları getirme
    console.log(usr);
    let active = usr.filter(user => user.dataValues.isActive === true);
    let pasive = usr.filter(user => user.dataValues.isActive === false);
    console.log(active);
    console.log(pasive);
    return res.status(200).json({
        activeUsersLen: active.length,
        activeUsers:active,
        passiveUsersLen: pasive.length,
        passiveUsers: pasive

    });
}

//toplam kurum sayısı(sadece admin için görülür)
const getAllCompaies = async (req,res) =>{
    const user = req.user;
    if(!user || (user.role==="manager" || user.role==="personal")){
        return res.status(403).json({ error: "Bu işlemi yapmak için yetkiniz yok." });
    }

    const company = await companyServices.getAllCompanies();
    console.log(company);

    return res.status(200).json({
        companyLen: company.length
    });
}

//sensör tiplerine göre dağılım yapma fonksoynu
const getSensorsTypesCount = async (req,res)=>{
    const user = req.user;
    if(!user){
        return res.status(403).json({ error: "Bu işlemi yapmak için yetkiniz yok." });
    }

    let types = await sensorServices.getTypes();
    let sensorsId
    let sensors;

    if(user.role==="administrator"){
        sensors = (await sensorServices.getAllSensors()).sensors; //admin tüm sensörleri getirir
    }else{ // manager veya personel kendisine ait olan sensörlerini getirir
        sensorsId=await sensorServices.getSensorIdsByOwner(user.id);
        sensors=await sensorServices.getSensorsByIds(sensorsId);
    }

    // Sensörleri türlerine göre gruplama
    const groupedSensors = {};
    const groupedLengths = {};

    //gruplama yapılır
    if (Array.isArray(sensors)) {
        sensors.forEach(sensor => {
            const type = sensor.dataValues?.type; // Type değerini al
            if (!groupedSensors[type]) {
                groupedSensors[type] = []; // Eğer type yoksa boş bir array oluştur
                groupedLengths[type] = 0; // Type için bir sayaç oluştur
            }
            groupedSensors[type].push(sensor.dataValues); // DataValues içeriğini ekle
            groupedLengths[type] += 1; // Gruptaki sensör sayısını artır
        });

        console.log("Grouped Sensors:", groupedSensors);
        console.log("Grouped Lengths:", groupedLengths);
    } else {
        console.error("Sensors verisi bir array değil:", sensors);
    }

    // JSON çıktısını geri döndür
    return res.status(200).json({
        groupedLengths,
        groupedSensors,
        types
    });
}

//kurumlara göre sensör dağılımı
const getCompanySensorStats= async (req,res)=>{
    const user = req.user;
    if(!user || (user.role==="manager"|| user.role==="personal")){
        return res.status(403).json({ error: "Bu işlemi yapmak için yetkiniz yok." });
    }

    let company = await companyServices.getAllCompanies();
    let sensors = await sensorServices.getAllSensors();
    console.log(company)
    if(!sensors || !company){
        return res.status(403).json({ error: "Sensör veya şirket bilgisi yok veya alınamadı" });
    }

    // Sensörleri türlerine göre gruplama
    const groupedCompany = {};
    const groupedLengths = {};

    if(!Array.isArray(sensors) || !Array.isArray(company)){
        sensors.sensors.forEach(sensors=>{
           const companyCode = sensors.dataValues.company_code;

            if (!groupedCompany[companyCode]) {
                groupedCompany[companyCode] = []; // Yeni bir grup oluştur
                groupedLengths[companyCode] = 0; // Sayaç başlat
            }
            groupedCompany[companyCode].push(sensors); // Sensörü ilgili gruba ekle
            groupedLengths[companyCode] += 1; // Sayaç artır
        });

    }else{
        console.error("Sensors verisi veya şirket verisi bir array değil:", sensors,company);
        return res.status(500).json({ error: "Sensör verisi veya şirket verisi beklenen formatta değil" });
    }

    return res.status(200).json({
        groupedLengths,
        company,
        groupedCompany
    });
}







module.exports={getTotalSensors,getIsActive,getAllCompaies,getSensorsTypesCount,getCompanySensorStats};