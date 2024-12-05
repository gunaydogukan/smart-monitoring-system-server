const express = require('express');
const router = express.Router();
const IPController = require("../../controllers/logs/IPLogsContoreller");
const { authenticateToken } = require("../../middleware/BearerTokenMiddleware");

router.post('/IP-controll',authenticateToken,IPController.updateIpLog);

router.get('/IP-controll',authenticateToken,IPController.getIpLogs);
//bunun get i gelecek

module.exports = router;