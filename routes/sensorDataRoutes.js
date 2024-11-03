const express = require('express');
const router = express.Router();
const sensorsDataController = require("../controllers/SensorDataControllers");
const { authenticateToken } = require("../middleware/BearerTokenMiddleware");


//sensör verilerinin tümünü alma (şimdilik);
router.get('/sensor-data',authenticateToken,sensorsDataController.getSensorData);

module.exports = router;