const express = require('express');
const router = express.Router();
const sensorsController = require("../controllers/SensorsControllers");

router.post('/type',sensorsController.addTypes);

module.exports = router;