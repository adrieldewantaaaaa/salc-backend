const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Semua route user butuh token
router.use(verifyToken);

// GET /api/users
router.get('/', UserController.getAll);

// GET /api/users/:id
router.get('/:id', UserController.getById);

// PUT /api/users/:id
router.put('/:id', UserController.update);

module.exports = router;
