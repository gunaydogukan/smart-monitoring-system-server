const express = require('express');
const router = express.Router();
const sensorsDataController = require("../controllers/SensorDataControllers");
const { authenticateToken } = require("../middleware/BearerTokenMiddleware");

//sensör verilerinin tümünü alma (şimdilik);
router.get('/sensor-data',authenticateToken,sensorsDataController.getSensorData);

// Sensör verisi eklemek için endpoint
//router.post('/sensor-data',authenticateToken,sensorsDataController.addSensorData);

router.get('/soil-moisture-map', authenticateToken, sensorsDataController.getSoilMoistureData);

module.exports = router;