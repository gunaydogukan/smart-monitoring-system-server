const express = require('express');
const router = express.Router();
const updateSensorLogsController = require('../../controllers/logs/UpdateSensorController');
const { authenticateToken } = require('../../middleware/BearerTokenMiddleware');

// Sensör güncelleme ve loglama
router.put('/update/:id', authenticateToken, updateSensorLogsController.updateSensor);

router.put('/update/isActiveForIP/:id/:isActive',authenticateToken,updateSensorLogsController.isActiveForIP);

module.exports = router;
