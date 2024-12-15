const express = require('express');
const router = express.Router();
const userController = require("../controllers/UserController");
const { authenticateToken, authorizeRole } = require("../middleware/BearerTokenMiddleware");
const  UpdateUserController  = require('../controllers/logs/UpdateUserController');

// Register endpoint: Sadece administrator rolüne sahip kullanıcılar ekleyebilir
router.post('/register', authenticateToken, authorizeRole(['administrator','manager']), userController.register);

// Login işlemi için token gerekmez
router.post('/login', userController.login);

// Address ekleme: Tüm yetkili kullanıcılar
router.post('/address', authenticateToken, userController.addAddress);

// Companies ekleme: Tüm yetkili kullanıcılar
router.post('/companies', authenticateToken, userController.addCompanies);

// Manager ekleme: Sadece administrator yetkisi
router.post('/manager', authenticateToken, authorizeRole(['administrator']), userController.addManager);

// Personal ekleme: Sadece manager veya administrator yetkisi
router.post('/personal', authenticateToken, authorizeRole(['manager', 'administrator']), userController.addPersonal);

//Compnay ekleme , sadece admin bu işlemi yapabilir
router.post('/companies', authenticateToken, authorizeRole(['administrator']), userController.addCompanies);


// Token doğrulama endpoint'i
router.get("/verifyToken", authenticateToken, (req, res) => {
    res.json({ valid: true, user: req.user }); // Geçerli token ile kullanıcı bilgisi döner
});

router.get('/cities', authenticateToken, userController.getCities); // Şehirleri listeleme

router.get('/profile', authenticateToken, userController.getProfile);

router.get('/companies', authenticateToken, userController.getCompanies);

//kullanıcı görüntüleme işlerini sadece manager ve admin yapabilir
router.get('/users',authenticateToken,userController.getUsers);
router.get('/managers',authenticateToken,userController.getManagersByCompany);
router.get('/personals',authenticateToken,userController.getPersonalsByCompany);

//Kurumlar'ın gösterildiği bölümde , kullanıcı sayıları ve sensör sayıları'da gözükür.
router.get('/companiesCount',authenticateToken,userController.getUserCount)
router.put('/update', authenticateToken, UpdateUserController.updateUser);
router.put('/modifyuser', authenticateToken, UpdateUserController.modifyUserDetails);
router.patch('/:id/deactivate', authenticateToken, UpdateUserController.deactivateUser);
router.patch('/:id/activate', authenticateToken, UpdateUserController.activateUser);

router.get('/company/:companyCode/undefined-users-and-managers', authenticateToken,
    UpdateUserController.getUndefinedUsersAndActiveManagers);

router.get('/users/undefined-users-and-managers', authenticateToken,
    UpdateUserController.withOutComapnyCodegetUndefinedUsersAndActiveManagers);

// Personelleri yeni bir manager'e atama
router.post('/assign-personals', authenticateToken,
    UpdateUserController.assignPersonalsToManager
);
const UpdateSensorController = require('../controllers/logs/UpdateSensorController');
router.post('/user/sensor-operations', authenticateToken,
    UpdateSensorController.handleSensorOperations);


module.exports = router;
