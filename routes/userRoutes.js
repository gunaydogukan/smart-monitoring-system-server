const express = require('express');
const router = express.Router();
const userController = require("../controllers/UserController");

router.post('/register', userController.register);
router.post('/login', userController.login);

router.post('/companies', userController.companiesAdd);
=======
router.post('/cities',userController.addCities);


module.exports = router;