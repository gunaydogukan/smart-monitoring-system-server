const express = require('express');
const router = express.Router();
const sensorsController = require("../controllers/SensorsControllers");
const { authenticateToken } = require("../middleware/BearerTokenMiddleware");
const  UpdateSensorController  = require('../controllers/logs/UpdateSensorController');

// Sensör ekleme ve tür ekleme
router.post('/add-new-type', authenticateToken, sensorsController.addNewType);

router.post('/sensors', authenticateToken, sensorsController.addSensors);

// Sensör türlerini alma
router.get('/type', authenticateToken, sensorsController.getTypes);

// Kullanıcıya ait sensörleri getiren route
router.get('/sensors', authenticateToken, sensorsController.getUserSensors);

//owner sensörleri gösterme
router.get('/user-sensors', authenticateToken, sensorsController.getUserSensors);

router.get('/undefined-sensors', authenticateToken, UpdateSensorController.fetchUndefinedSensors);

router.post('/sensors-assign' ,authenticateToken,UpdateSensorController.assignSensorsToManager)

router.get("/company/:companyCode/sensors", authenticateToken, sensorsController.getSensorsByCompany);

router.post('/assign-random-sensors', authenticateToken, UpdateSensorController.assignSensorsToUser);

module.exports = router;
