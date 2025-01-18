const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

router.get('/:filename', (req, res) => {
    const fileName = req.params.filename;
    const desktopPath = path.join(require('os').homedir(), 'Desktop');
    const filePath = path.join(desktopPath, fileName);

    console.log("İstenen dosya adı:", fileName);
    console.log("Tam dosya yolu:", filePath);

    if (!fs.existsSync(filePath)) {
        console.error("Dosya bulunamadı:", filePath);
        return res.status(404).send('Dosya bulunamadı.');
    }

    res.download(filePath, fileName, (err) => {
        if (err) {
            console.error("Dosya indirilirken hata oluştu:", err);
            res.status(500).send('Dosya indirilemedi.');
        }
    });
});


module.exports = router;
