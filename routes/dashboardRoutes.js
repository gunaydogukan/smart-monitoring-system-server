const express = require('express');
const router = express.Router();
const { authenticateToken } = require("../middleware/BearerTokenMiddleware");
const dashboardController = require('../controllers/dashboardController');

router.get('/getSensors',authenticateToken,dashboardController.getTotalSensors);
router.get('/getIsActive',authenticateToken,dashboardController.getIsActive);
router.get('/getAllCompanies',authenticateToken,dashboardController.getAllCompanies);
router.get('/getSensorTypeClass',authenticateToken,dashboardController.getSensorsTypesCount);
router.get('/getCompanySensorStats',authenticateToken,dashboardController.getCompanySensorStats);
router.get('/getSensorLogToAction',authenticateToken,dashboardController.getSensorLogToAction);
router.get('/getSensorLogs',authenticateToken,dashboardController.getSensorLog);
router.get('/getUserLogs',authenticateToken,dashboardController.getUserLog);

module.exports = router;
