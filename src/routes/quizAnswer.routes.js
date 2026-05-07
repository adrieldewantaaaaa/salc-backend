const express = require('express');
const router = express.Router();
const QuizAnswerController = require('../controllers/quizAnswer.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

router.use(verifyToken);

// Siswa submit jawaban
router.post('/',       QuizAnswerController.submitOne);
router.post('/bulk',   QuizAnswerController.submitBulk);

// Siswa lihat jawaban sendiri
router.get('/',                          QuizAnswerController.getMyAnswers);
router.get('/material/:materialId',      QuizAnswerController.getByMaterial);

// Guru/admin lihat semua jawaban siswa per materi
router.get('/material/:materialId/all',  authorizeRoles('teacher', 'admin'), QuizAnswerController.getAllByMaterial);

module.exports = router;
