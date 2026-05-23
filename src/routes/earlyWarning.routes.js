const express = require('express');
const router = express.Router();
const EarlyWarningController = require('../controllers/earlyWarning.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

router.use(verifyToken);

// Siswa cek risiko dari aktivitas belajar
router.get('/me',                   EarlyWarningController.checkMyRisk);

// Siswa cek risiko dari performa akademik
router.post('/performance',         EarlyWarningController.checkPerformanceRisk);

// Guru & admin lihat semua siswa berisiko
router.get('/unresolved',           authorizeRoles('teacher', 'admin'), EarlyWarningController.getUnresolved);

// Guru & admin tandai sudah ditangani
router.patch('/:id/resolve',        authorizeRoles('teacher', 'admin'), EarlyWarningController.resolve);

module.exports = router;