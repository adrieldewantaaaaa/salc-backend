const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes           = require('./routes/auth.routes');
const userRoutes           = require('./routes/user.routes');
const progressRoutes       = require('./routes/progress.routes');
const predictionRoutes     = require('./routes/prediction.routes');
const materialRoutes       = require('./routes/material.routes');
const earlyWarningRoutes   = require('./routes/earlyWarning.routes');
const recommendationRoutes = require('./routes/recommendation.routes');
const quizAnswerRoutes     = require('./routes/quizAnswer.routes');

app.use('/api/auth',            authRoutes);
app.use('/api/users',           userRoutes);
app.use('/api/progress',        progressRoutes);
app.use('/api/predictions',     predictionRoutes);
app.use('/api/materials',       materialRoutes);
app.use('/api/early-warning',   earlyWarningRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/quiz',            quizAnswerRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'SALC API is running', version: '1.0.0' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

module.exports = app;
