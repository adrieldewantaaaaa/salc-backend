/**
 * Validation middleware
 * Validasi input sebelum masuk ke controller
 */

const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Invalid email format');
  }
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors[0], errors });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Invalid email format');
  }
  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors[0], errors });
  }
  next();
};

const validateProgress = (req, res, next) => {
  const { materialId, score, status } = req.body;
  const errors = [];
  const validStatuses = ['not_started', 'in_progress', 'completed'];

  if (!materialId || isNaN(materialId)) {
    errors.push('materialId must be a valid number');
  }
  if (score === undefined || isNaN(score) || score < 0 || score > 100) {
    errors.push('Score must be a number between 0 and 100');
  }
  if (!status || !validStatuses.includes(status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors[0], errors });
  }
  next();
};

const validateMaterial = (req, res, next) => {
  const { title, subject, difficulty } = req.body;
  const errors = [];
  const validDifficulties = ['easy', 'medium', 'hard'];

  if (!title || title.trim().length < 3) {
    errors.push('Title must be at least 3 characters');
  }
  if (!subject || subject.trim().length < 2) {
    errors.push('Subject must be at least 2 characters');
  }
  if (difficulty && !validDifficulties.includes(difficulty)) {
    errors.push(`Difficulty must be one of: ${validDifficulties.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors[0], errors });
  }
  next();
};

const validateQuizBulk = (req, res, next) => {
  const { materialId, answers } = req.body;
  const errors = [];

  if (!materialId || isNaN(materialId)) {
    errors.push('materialId must be a valid number');
  }
  if (!Array.isArray(answers) || answers.length === 0) {
    errors.push('answers must be a non-empty array');
  } else {
    answers.forEach((a, i) => {
      if (!a.question || !a.answer) {
        errors.push(`Answer at index ${i} must have question and answer fields`);
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors[0], errors });
  }
  next();
};

const validateFeedback = (req, res, next) => {
  const { questionId, answer } = req.body;
  const errors = [];

  if (!questionId || isNaN(questionId)) {
    errors.push('questionId must be a valid number');
  }
  if (!answer || answer.trim().length < 3) {
    errors.push('Answer must be at least 3 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors[0], errors });
  }
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateProgress,
  validateMaterial,
  validateQuizBulk,
  validateFeedback,
};
