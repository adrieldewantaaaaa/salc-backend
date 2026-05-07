const express = require('express');
const router = express.Router();
const MaterialController = require('../controllers/material.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const { validateMaterial } = require('../middlewares/validation.middleware');

router.use(verifyToken);

// Semua user bisa lihat materi
router.get('/',     MaterialController.getAll);
router.get('/:id',  MaterialController.getById);

// Hanya teacher & admin yang bisa buat, edit, hapus
router.post('/',    authorizeRoles('teacher', 'admin'), validateMaterial, MaterialController.create);
router.put('/:id',  authorizeRoles('teacher', 'admin'), validateMaterial, MaterialController.update);
router.delete('/:id', authorizeRoles('teacher', 'admin'), MaterialController.delete);

module.exports = router;
