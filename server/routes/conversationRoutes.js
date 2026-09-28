const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Search conversations
router.get('/search', conversationController.search);

// List all conversations
router.get('/', conversationController.list);

// Create new conversation
router.post('/', conversationController.create);

// Get single conversation
router.get('/:id', conversationController.getById);

// Update conversation
router.patch('/:id', conversationController.update);

// Delete conversation
router.delete('/:id', conversationController.delete);

// Get messages for conversation
router.get('/:id/messages', conversationController.getMessages);

module.exports = router;
