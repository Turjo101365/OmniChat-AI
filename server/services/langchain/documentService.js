const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const db = require('../../config/database');

class DocumentService {
  /**
   * Parses uploaded file into text chunks with page & offset metadata
   */
  static async processUploadedFile({
    userId = 1,
    conversationId = null,
    filePath,
    originalFilename,
    mimeType,
    fileSize,
  }) {
    const filename = path.basename(filePath);
    let extractedText = '';
    const pageMetadata = [];

    // 1. Text extraction based on file type
    if (mimeType === 'application/pdf' || originalFilename.toLowerCase().endsWith('.pdf')) {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      extractedText = pdfData.text || '';
      // Approximate pages
      const totalPages = pdfData.numpages || 1;
      const charsPerPage = Math.max(1, Math.floor(extractedText.length / totalPages));
      for (let p = 1; p <= totalPages; p++) {
        pageMetadata.push({
          page: p,
          start: (p - 1) * charsPerPage,
          end: p * charsPerPage,
        });
      }
    } else {
      // Text / Markdown / CSV / JSON
      extractedText = fs.readFileSync(filePath, 'utf-8');
      pageMetadata.push({ page: 1, start: 0, end: extractedText.length });
    }

    if (!extractedText.trim()) {
      throw new Error('Could not extract any readable text from the uploaded document.');
    }

    // 2. Text splitting with LangChain RecursiveCharacterTextSplitter
    const chunkSize = parseInt(process.env.CHUNK_SIZE || '1000', 10);
    const chunkOverlap = parseInt(process.env.CHUNK_OVERLAP || '200', 10);

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators: ['\n\n', '\n', '. ', ' ', ''],
    });

    const rawChunks = await splitter.splitText(extractedText);

    // 3. Save Document in MySQL
    const docResult = await db.query(
      `INSERT INTO documents (user_id, conversation_id, filename, original_filename, mime_type, file_path, file_size, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'processed')`,
      [userId, conversationId, filename, originalFilename, mimeType, filePath, fileSize]
    );
    const documentId = docResult.insertId;

    // 4. Save Chunks with accurate Page references in MySQL
    const chunkRecords = [];
    for (let i = 0; i < rawChunks.length; i++) {
      const chunkText = rawChunks[i];
      // Find approximate page number based on chunk text index
      const approxOffset = extractedText.indexOf(chunkText.slice(0, 40));
      let pageNumber = 1;
      if (approxOffset !== -1) {
        const found = pageMetadata.find((p) => approxOffset >= p.start && approxOffset <= p.end);
        if (found) pageNumber = found.page;
      }

      const meta = {
        documentId,
        document: originalFilename,
        page: pageNumber,
        chunkIndex: i,
        length: chunkText.length,
      };

      await db.query(
        `INSERT INTO document_chunks (document_id, chunk_index, content, metadata)
         VALUES (?, ?, ?, ?)`,
        [documentId, i, chunkText, JSON.stringify(meta)]
      );

      chunkRecords.push({
        id: i,
        documentId,
        chunkIndex: i,
        content: chunkText,
        metadata: meta,
      });
    }

    return {
      documentId,
      filename,
      originalFilename,
      chunkCount: chunkRecords.length,
      totalLength: extractedText.length,
    };
  }

  /**
   * Retrieves all chunks for a document or conversation
   */
  static async getChunksByDocumentId(documentId) {
    const rows = await db.query(
      'SELECT id, document_id, chunk_index, content, metadata FROM document_chunks WHERE document_id = ? ORDER BY chunk_index ASC',
      [documentId]
    );

    return rows.map((r) => ({
      ...r,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata || {},
    }));
  }

  /**
   * Lists all documents for a user or conversation
   */
  static async listDocuments(userId = 1, conversationId = null) {
    let sql = 'SELECT id, user_id, conversation_id, filename, original_filename, mime_type, file_size, status, created_at FROM documents WHERE user_id = ?';
    const params = [userId];

    if (conversationId) {
      sql += ' AND (conversation_id = ? OR conversation_id IS NULL)';
      params.push(conversationId);
    }
    sql += ' ORDER BY created_at DESC';

    const rows = await db.query(sql, params);
    return rows;
  }

  /**
   * Deletes a document and its stored chunks
   */
  static async deleteDocument(id) {
    const rows = await db.query('SELECT file_path FROM documents WHERE id = ? LIMIT 1', [id]);
    if (rows[0]?.file_path && fs.existsSync(rows[0].file_path)) {
      try {
        fs.unlinkSync(rows[0].file_path);
      } catch (e) {
        // ignore file unlink errors
      }
    }
    const result = await db.query('DELETE FROM documents WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = DocumentService;
