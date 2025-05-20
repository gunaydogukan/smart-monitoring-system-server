const express = require('express');
const router = express.Router();
const SensorDataController = require("../../controllers/logs/SensorDataLogsController");
const { authenticateToken } = require("../../middleware/BearerTokenMiddleware");

router.get('/data-time-check', authenticateToken, SensorDataController.checkSensorDataTimestamp);

module.exports = router;