const express = require('express');
const router = express.Router();
const langsmithController = require('../controllers/langsmithController');

router.get('/status', langsmithController.getStatus);
router.get('/runs', langsmithController.getRuns);

module.exports = router;
