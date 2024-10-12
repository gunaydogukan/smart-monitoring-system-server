const express = require('express');
const router = express.Router();
const sensorsController = require("../controllers/SensorsControllers");
const authenticateToken = require('../middleware/BearerTokenMiddleware'); // Middleware

router.post('/type',authenticateToken,sensorsController.addTypes);
router.post('/sensors',authenticateToken,sensorsController.addSensors);

router.get('/type',authenticateToken, sensorsController.getTypes);

module.exports = router;