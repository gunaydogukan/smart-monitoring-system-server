const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sequelize = require("./config/database");
const sensorCheckRoutes = require('./routes/sensorCheck/sensorCheckRouter');
const userRoutes = require('./routes/userRoutes');
const sensorRoutes = require('./routes/sensorsRoutes');
const sensorDataRoutes = require('./routes/sensorDataRoutes');
const IPlogsRoutes = require('./routes/logs/IpLogRoutes');
const SensorDatalogsRoutes = require('./routes/logs/SensorDataLogRoutes');
const sensorLogsRoutes = require('./routes/logs/sensorLogsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
require('dotenv').config();
const downloadRoutes = require('./routes/download'); // Yeni eklenen dosya

const app = express();
const port = 5000;


// Belirli bir domain için izin ver (önerilen)
app.use(
    cors({
        origin: 'http://localhost:3000', // Frontend URL
        methods: ['GET', 'POST', 'PUT', 'DELETE'], // İzin verilen HTTP yöntemleri
        allowedHeaders: ['Content-Type', 'Authorization'], // İzin verilen header'lar
        credentials: true, // Eğer cookie veya authorization header gönderilecekse
    })
);

app.use(express.json());
app.use(bodyParser.json());

app.use('/api', userRoutes);
app.use('/api', sensorRoutes);
app.use('/api', sensorDataRoutes);
app.use('/api/sensors', sensorCheckRoutes);
app.use('/log', IPlogsRoutes);
app.use('/log', SensorDatalogsRoutes);
app.use('/api/sensor-logs', sensorLogsRoutes);
app.use('/api/dashboard',dashboardRoutes);
app.use('/download', downloadRoutes);

sequelize
    //.sync({ alter: true })
    .authenticate()
    .then(() => {

        console.log('Veritabanı ve tablolar başarıyla senkronize edildi.');
        app.listen(port, () => {
            console.log(`sunucu ${port} unda çalışıyor`)
        })

    })
    .catch((error) => {
        console.error('Veritabanı senkronizasyon hatası:', error);
    });



