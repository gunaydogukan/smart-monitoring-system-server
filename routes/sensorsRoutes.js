const express = require('express');
const router = express.Router();
const sensorsController = require("../controllers/SensorsControllers");
const { authenticateToken } = require("../middleware/BearerTokenMiddleware");

// Sensör ekleme ve tür ekleme
router.post('/type', authenticateToken, sensorsController.addTypes);
router.post('/sensors', authenticateToken, sensorsController.addSensors);

// Sensör türlerini alma
router.get('/type', authenticateToken, sensorsController.getTypes);

// Kullanıcıya ait sensörleri getiren route
router.get('/sensors', authenticateToken, sensorsController.getUserSensors);

//owner sensörleri gösterme
router.get('/user-sensors', authenticateToken, sensorsController.getUserSensors);

module.exports = router;
