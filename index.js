const express = require('express');
const cors = require('cors');
const sequelize = require("./config/database");
const userRoutes = require('./routes/userRoutes');
require('dotenv').config();

const app = express();
const port = 5000;
app.use(cors());

app.use(express.json());
app.use('/api', userRoutes);


sequelize.sync({ force: false })
    .then(() => {
        console.log("Veritabanı ve tablolar başarıyla senkronize edildi.");
        app.listen(port, () => {
            console.log(`Sunucu ${port} portunda çalışıyor.`);
        });
    })
    .catch((error) => {
        console.error("Veritabanı senkronizasyon hatası:", error);
    });


