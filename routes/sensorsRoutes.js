const express = require('express');
const router = express.Router();
const sensorsController = require("../controllers/SensorsControllers");
const { authenticateToken, authorizeRole} = require("../middleware/BearerTokenMiddleware");
const  UpdateSensorController  = require('../controllers/logs/UpdateSensorController');

// Sensör ekleme ve tür ekleme
router.post('/add-new-type', authenticateToken,authorizeRole(['administrator']), sensorsController.addNewType);

router.post('/sensors', authenticateToken, authorizeRole(['administrator','manager']), sensorsController.addSensors);

router.post('/assign-random-sensors', authenticateToken, UpdateSensorController.assignSensorsToUser);

router.post('/sensors-assign' ,authenticateToken,UpdateSensorController.assignSensorsToManager)

// Sensör türlerini alma
router.get('/type', authenticateToken, sensorsController.getTypes);

// Kullanıcıya ait sensörleri getiren route
router.get('/sensors', authenticateToken, sensorsController.getUserSensors);

//owner sensörleri gösterme
router.get('/user-sensors', authenticateToken, sensorsController.getUserSensors);

router.get('/undefined-sensors', authenticateToken, UpdateSensorController.fetchUndefinedSensors);

router.get("/company/:companyCode/sensors", authenticateToken, sensorsController.getSensorsByCompany);

module.exports = router;
