const express = require('express');
const cors = require('cors');
const sequelize = require("./config/database");
const sensorCheckRoutes = require('./routes/sensorCheck/sensorCheckRouter');
const userRoutes = require('./routes/userRoutes');
const sensorRoutes = require('./routes/sensorsRoutes');
const sensorDataRoutes = require('./routes/sensorDataRoutes');
const IPlogsRoutes = require('./routes/logs/IpLogRoutes');
const SensorDatalogsRoutes = require('./routes/logs/SensorDataLogRoutes');

require('dotenv').config();

const app = express();
const port = 5000;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

app.use(express.json());

app.use('/api', userRoutes);
app.use('/api', sensorRoutes);
app.use('/api', sensorDataRoutes);
app.use('/api/sensors', sensorCheckRoutes);
app.use('/log', IPlogsRoutes);
app.use('/log', SensorDatalogsRoutes);

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



