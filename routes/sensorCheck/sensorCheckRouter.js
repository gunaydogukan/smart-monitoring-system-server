const express = require('express');
const router = express.Router();
const sensorCheckController = require('../../controllers/checkData/sensorCheckController');

// Checkbox değişikliklerini kaydetme işlemi
router.post('/checkBoxChanges', sensorCheckController.addCheckBoxChancehing);

// Tüm sensör verilerini getirme işlemi
router.get('/all-sensors', sensorCheckController.getAllSensors);

// Belirli bir sensör verisini isme göre getirme işlemi
router.get('/:name', sensorCheckController.getSensorByName);

module.exports = router;