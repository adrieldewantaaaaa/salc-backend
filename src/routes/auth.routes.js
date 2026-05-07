const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { validateRegister, validateLogin } = require('../middlewares/validation.middleware');

router.post('/register', validateRegister, AuthController.register);
router.post('/login',    validateLogin,    AuthController.login);
router.get('/me',        verifyToken,      AuthController.me);

module.exports = router;
