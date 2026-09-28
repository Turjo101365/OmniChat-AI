import React, { useRef } from 'react';
import { FileText, Upload, Trash2, CheckCircle2, Loader2, X, Plus } from 'lucide-react';
import { useChat } from '../hooks/useChat';

export default function DocumentUploadModal({ isOpen, onClose }) {
  const {
    documents,
    activeDocument,
    setActiveDocument,
    uploadDocumentFile,
    deleteDocumentFile,
    uploadingDocument,
  } = useChat();

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadDocumentFile(file);
    }
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Knowledge Base & RAG Documents</h3>
              <p className="text-xs text-gray-500">Upload PDF or text files for context-grounded AI search</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Upload Drop Area */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.txt,.md,.json,.csv"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingDocument}
            className="w-full border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50/40 rounded-xl p-6 text-center transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer disabled:opacity-60"
          >
            {uploadingDocument ? (
              <>
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                <span className="text-xs font-semibold text-blue-700">Chunking & Vectorizing Document...</span>
                <span className="text-[11px] text-gray-400">Extracting text, computing embeddings, and saving to vector store</span>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-white shadow-2xs border border-gray-200 flex items-center justify-center text-gray-500 group-hover:text-blue-600 group-hover:scale-105 transition-all">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-gray-800 group-hover:text-blue-600">
                  Click to upload a document (PDF, TXT, MD)
                </span>
                <span className="text-[11px] text-gray-400">
                  Documents are automatically split into overlapping chunks for precise retrieval
                </span>
              </>
            )}
          </button>
        </div>

        {/* Documents List */}
        <div className="p-5 flex-1 overflow-y-auto">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Available Documents ({documents.length})
          </h4>

          {documents.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">
              No documents uploaded yet. Upload a document above to enable RAG.
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => {
                const isSelected = activeDocument?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setActiveDocument(doc)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 shadow-2xs'
                        : 'border-gray-200 hover:bg-gray-50 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate flex-1 min-w-0 mr-3">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-gray-900 truncate">
                            {doc.original_filename || doc.filename}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded font-medium">
                              Active Context
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400">
                          {Math.round(doc.file_size / 1024)} KB • Ready for RAG
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDocument(doc);
                          }}
                          className="px-2 py-1 text-[11px] font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-md"
                        >
                          Select
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDocumentFile(doc.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Delete document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs">
          <span className="text-gray-500">
            {activeDocument ? `Selected: ${activeDocument.original_filename || activeDocument.filename}` : 'No document selected'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-2xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
