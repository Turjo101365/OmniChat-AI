-- Create database if not exists
CREATE DATABASE IF NOT EXISTS ai_chatbot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ai_chatbot;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
    provider VARCHAR(50) NOT NULL DEFAULT 'openrouter',
    model VARCHAR(100) NOT NULL DEFAULT 'openai/gpt-4o',
    external_conversation_id VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    CONSTRAINT fk_conversations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    role ENUM('user', 'assistant', 'system') NOT NULL,
    content MEDIUMTEXT NOT NULL,
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    token_usage JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_conv_id (conversation_id),
    INDEX idx_role (role),
    CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Provider Configs Table
CREATE TABLE IF NOT EXISTS provider_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_name VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_provider_model (provider_name, model_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usage Logs Table
CREATE TABLE IF NOT EXISTS usage_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    conversation_id INT NULL,
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    input_tokens INT DEFAULT 0,
    output_tokens INT DEFAULT 0,
    total_tokens INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usage_user (user_id),
    INDEX idx_usage_provider (provider),
    CONSTRAINT fk_usage_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_usage_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL DEFAULT 1,
    conversation_id INT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'processed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_doc_user (user_id),
    INDEX idx_doc_conv (conversation_id),
    CONSTRAINT fk_doc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_doc_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Document Chunks Table
CREATE TABLE IF NOT EXISTS document_chunks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    chunk_index INT NOT NULL,
    content MEDIUMTEXT NOT NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_chunk_doc (document_id),
    CONSTRAINT fk_chunk_doc FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Default User (Demo User: demo@example.com / password123)
INSERT INTO users (id, name, email, password_hash)
VALUES (1, 'Demo User', 'demo@example.com', '$2a$10$e7ZfHovb5UeG4gHw8fH72eWjA0M1b5K2L9x1n/2kP5bWjA0M1b5K2')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Seed Initial Provider Configurations
INSERT IGNORE INTO provider_configs (provider_name, model_name, enabled) VALUES
('openrouter', 'openai/gpt-4o', TRUE),
('openrouter', 'meta-llama/llama-3.2-3b-instruct:free', TRUE),
('openrouter', 'meta-llama/llama-3.1-8b-instruct:free', TRUE),
('openrouter', 'google/gemini-2.0-flash-exp:free', TRUE),
('openrouter', 'mistralai/mistral-7b-instruct:free', TRUE),
('openrouter', 'openai/gpt-4o-mini', TRUE),
('openrouter', 'anthropic/claude-3.5-haiku', TRUE),
('openrouter', 'deepseek/deepseek-chat', TRUE),
('huggingface', 'meta-llama/Llama-3.2-3B-Instruct', TRUE),
('huggingface', 'meta-llama/Llama-3.1-8B-Instruct', TRUE),
('huggingface', 'mistralai/Mistral-7B-Instruct-v0.3', TRUE),
('huggingface', 'Qwen/Qwen2.5-72B-Instruct', TRUE),
('huggingface', 'microsoft/Phi-3.5-mini-instruct', TRUE),
('botpress', 'default-assistant', TRUE);
