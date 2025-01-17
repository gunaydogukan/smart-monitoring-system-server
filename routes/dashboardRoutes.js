const express = require('express');
const router = express.Router();
const { authenticateToken } = require("../middleware/BearerTokenMiddleware");
const dashboardController = require('../controllers/dashboardController');

router.get('/getSensors',authenticateToken,dashboardController.getTotalSensors);
router.get('/getIsActive',authenticateToken,dashboardController.getIsActive);
router.get('/getAllCompanies',authenticateToken,dashboardController.getAllCompaies);
router.get('/getSensorTypeClass',authenticateToken,dashboardController.getSensorsTypesCount);
router.get('/getCompanySensorStats',authenticateToken,dashboardController.getCompanySensorStats);
router.get('/getSensorLogs',authenticateToken,dashboardController.getSensorLog);
module.exports = router;
