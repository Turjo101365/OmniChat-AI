const express = require('express');
const router = express.Router();
const langgraphController = require('../controllers/langgraphController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// LangGraph Agent Endpoints
router.post('/chat', langgraphController.chat);
router.get('/state/:threadId', langgraphController.getState);
router.get('/topology', langgraphController.getTopology);

module.exports = router;
