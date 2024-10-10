const express = require('express');
const router = express.Router();
const sensorsController = require("../controllers/SensorsControllers");

router.post('/type',sensorsController.addTypes);
router.post('/sensors',sensorsController.addSensors);

module.exports = router;