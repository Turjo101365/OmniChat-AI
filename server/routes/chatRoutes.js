const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Unified chat endpoint
router.post('/', chatController.handleChat);

// Provider-specific chat endpoints
router.post('/huggingface', chatController.handleHuggingFaceChat);
router.post('/openrouter', chatController.handleOpenRouterChat);
router.post('/botpress', chatController.handleBotpressChat);

module.exports = router;
