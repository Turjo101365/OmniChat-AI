const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const langchainController = require('../controllers/langchainController');
const authMiddleware = require('../middleware/authMiddleware');

// Configure Multer storage
const uploadDir = path.resolve(__dirname, '../uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.pdf', '.txt', '.md', '.json', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext) || file.mimetype === 'application/pdf' || file.mimetype.startsWith('text/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Supported formats: PDF, TXT, MD, JSON, CSV.'));
    }
  },
});

router.use(authMiddleware);

// LangChain Chat Endpoints
router.post('/chat', langchainController.chat);
router.post('/chat/stream', langchainController.stream);

// Document & RAG Endpoints
router.post('/documents/upload', upload.single('document'), langchainController.uploadDocument);
router.get('/documents', langchainController.listDocuments);
router.delete('/documents/:id', langchainController.deleteDocument);
router.post('/rag/query', langchainController.queryRag);

module.exports = router;
