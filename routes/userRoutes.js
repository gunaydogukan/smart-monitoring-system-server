const express = require('express');
const router = express.Router();
const userController = require("../controllers/UserController");

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/address',userController.addAddress);
router.post('/companies', userController.addCompanies);



module.exports = router;