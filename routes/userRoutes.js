const express = require('express');
const router = express.Router();
const userController = require("../controllers/UserController");
const authenticateToken = require('../middleware/BearerTokenMiddleware'); // Middleware

router.post('/register',authenticateToken, userController.register);
router.post('/login', userController.login);
router.post('/address',authenticateToken,userController.addAddress);
router.post('/companies',authenticateToken, userController.addCompanies);
router.post('/manager',authenticateToken, userController.addManager);
router.post('/personal',authenticateToken, userController.addPersonal);


module.exports = router;