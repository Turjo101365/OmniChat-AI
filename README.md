# OmniChat AI — Full-Stack Multi-Provider AI Chatbot

A production-grade, full-stack AI Chatbot platform engineered with **React.js (Vite)**, **Tailwind CSS**, **Node.js (Express)**, and **MySQL 8.0** running in **Docker** with **phpMyAdmin**.

OmniChat AI features an extensible **AI Provider Abstraction Layer** allowing users to switch dynamically between **Hugging Face Inference Providers**, **OpenRouter Gateway Models**, and **Botpress Autonomous Bots** without leaking API secrets to the browser.

---

## Architecture Diagram

```
 ┌────────────────────────────────────────────────────────┐
 │            React + Vite Frontend (Port 5173)           │
 │  - Light-Themed Modern ChatGPT Interface               │
 │  - Dynamic Provider & Model Switcher                   │
 │  - Markdown & Code Highlighting with One-Click Copy    │
 │  - Sidebar Conversation History (Search, Rename, Del)  │
 └───────────────────────────┬────────────────────────────┘
                             │ HTTP REST API (Axios Proxy)
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │           Node.js Express Backend (Port 5002)          │
 │  - Unified Endpoint (POST /api/chat)                   │
 │  - Provider Abstraction (providerManager.js)           │
 │  - Token Usage Logging & Request Rate Limiting         │
 │  - Zero-Leak Security & Sanitized Error Handling       │
 └─────────────┬───────────────────────────┬──────────────┘
               │                           │
      ┌────────┴────────┐       ┌──────────┴──────────────┐
      ▼                 ▼       ▼                         ▼
┌─────────────┐ ┌─────────────┐ ┌───────────────┐ ┌───────────────┐
│OpenRouter   │ │Hugging Face │ │Botpress Cloud │ │MySQL 8.0 (DB) │
│API Gateway  │ │Inference API│ │Autonomous Bot │ │+ phpMyAdmin   │
└─────────────┘ └─────────────┘ └───────────────┘ └───────────────┘
```

---

## Key Features

- **Provider Abstraction Layer**: The frontend never directly talks to AI providers or holds API keys. All provider communication routes through `providerManager.js`.
- **Dynamic Model Discovery**: Available models and configurations for OpenRouter and Hugging Face are queried from the backend dynamically.
- **MySQL 8 Persistence**: Full storage of users, conversations, user messages, AI responses, token usage metrics, and provider configurations.
- **Docker Compose Stack**: One-command initialization of MySQL 8 and phpMyAdmin with volume persistence and automated SQL schema migrations.
- **Modern Light UI / UX**:
  - Clean white/light gray background with subtle borders and rounded elements.
  - ChatGPT-like sidebar: New chat, live search filter, inline rename, delete confirmation, and active indicators.
  - Rich Markdown rendering with GitHub Flavored Markdown (`remark-gfm`).
  - Code blocks with language badges and animated "Copy Code" button.
  - "Copy Response" and "Regenerate Response" actions.
  - Auto-resizing message input with Shift+Enter multi-line and file attachment chip.
- **Enterprise Security**:
  - API keys strictly confined to backend `.env`.
  - CORS security & IP rate limiting (`express-rate-limit`).
  - Automatic key redaction in error handlers (no keys or stack traces leaked).
  - SQL injection protection via `mysql2` parameterized queries.

---

## Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Axios, React Router 7, Lucide React, React Markdown, Remark GFM |
| **Backend** | Node.js (v24), Express.js, Axios, dotenv, CORS, express-rate-limit, bcryptjs |
| **Database** | MySQL 8.0 (Dockerized) with connection pooling via `mysql2/promise` |
| **Database GUI** | phpMyAdmin (Dockerized) |
| **AI Providers** | OpenRouter (GPT-4o, Claude 3.5, Gemini 2.0, free models), Hugging Face Inference API, Botpress |

---

## Folder Structure

```
├── docker-compose.yml           # MySQL 8 and phpMyAdmin container services
├── .env.example                 # Template for environment variables
├── .env                         # Active local environment variables
├── package.json                 # Frontend dependencies and dev scripts
├── vite.config.js               # Vite configuration with API proxy
├── tailwind.config.js           # Tailwind design tokens and content globs
├── index.html                   # HTML root template
│
├── server/                      # Node.js Express Backend
│   ├── config/
│   │   ├── database.js          # MySQL connection pool & auto-bootstrap
│   │   ├── env.js               # Safe environment variable accessor
│   │   └── init.sql             # SQL database schema and seed data
│   ├── controllers/
│   │   ├── chatController.js         # Unified & provider-specific chat handlers
│   │   ├── conversationController.js # Conversations & messages CRUD
│   │   └── providerController.js     # Providers & models endpoints
│   ├── middleware/
│   │   ├── authMiddleware.js    # User context & token verification
│   │   └── errorHandler.js      # Sanitized error handler with key redaction
│   ├── models/
│   │   ├── User.js              # User SQL queries
│   │   ├── Conversation.js      # Conversation SQL queries
│   │   ├── Message.js           # Message SQL queries
│   │   └── UsageLog.js          # Token usage metrics SQL queries
│   ├── routes/
│   │   ├── chatRoutes.js        # /api/chat routes
│   │   ├── conversationRoutes.js# /api/conversations routes
│   │   └── providerRoutes.js    # /api/providers routes
│   ├── services/
│   │   ├── chatService.js       # Chat orchestration & persistence
│   │   ├── conversationService.js
│   │   └── providers/
│   │       ├── huggingfaceProvider.js # Hugging Face Inference API
│   │       ├── openrouterProvider.js  # OpenRouter API integration
│   │       ├── botpressProvider.js    # Botpress API integration
│   │       └── providerManager.js     # Uniform provider abstraction
│   ├── utils/
│   │   └── responseParser.js    # Provider response parsing & token extractor
│   ├── app.js                   # Express application setup
│   ├── server.js                # Server entry point
│   └── package.json             # Backend dependencies
│
└── src/                         # React Frontend
    ├── components/
    │   ├── ChatWindow.jsx       # Chat layout, message scroll, empty state
    │   ├── ErrorMessage.jsx     # Friendly error alerts
    │   ├── LoadingIndicator.jsx # Animated typing dots
    │   ├── MessageBubble.jsx    # Markdown renderer & syntax code blocks
    │   ├── MessageInput.jsx     # Auto-expanding textarea & send actions
    │   ├── ModelSelector.jsx    # Dynamic model dropdown
    │   ├── Navbar.jsx           # Top brand & provider status bar
    │   ├── ProviderSelector.jsx # Provider switch dropdown
    │   └── Sidebar.jsx          # ChatGPT-style conversation drawer
    ├── context/
    │   └── ChatContext.jsx      # Centralized React state management
    ├── hooks/
    │   └── useChat.js           # Convenient chat hook wrapper
    ├── pages/
    │   ├── Home.jsx             # Landing page with hero & feature cards
    │   └── Chat.jsx             # Primary chat screen
    ├── services/
    │   └── api.js               # Axios REST API client
    ├── utils/
    │   └── helpers.js           # Formatters & badge styling
    ├── App.jsx                  # React Router configuration
    ├── main.jsx                 # React root render
    └── index.css                # Tailwind directives & custom scrollbars
```

---

## Database Schema (`ai_chatbot`)

1. **`users`**:
   - `id`: INT AUTO_INCREMENT PRIMARY KEY
   - `name`: VARCHAR(255) NOT NULL
   - `email`: VARCHAR(255) NOT NULL UNIQUE
   - `password_hash`: VARCHAR(255) NOT NULL
   - `created_at`, `updated_at`: TIMESTAMP
2. **`conversations`**:
   - `id`: INT AUTO_INCREMENT PRIMARY KEY
   - `user_id`: INT (FK `users.id` ON DELETE CASCADE)
   - `title`: VARCHAR(255)
   - `provider`: VARCHAR(50) (e.g., `openrouter`, `huggingface`, `botpress`)
   - `model`: VARCHAR(100)
   - `external_conversation_id`: VARCHAR(255) (stores Botpress session IDs)
   - `created_at`, `updated_at`: TIMESTAMP
3. **`messages`**:
   - `id`: INT AUTO_INCREMENT PRIMARY KEY
   - `conversation_id`: INT (FK `conversations.id` ON DELETE CASCADE)
   - `role`: ENUM('user', 'assistant', 'system')
   - `content`: MEDIUMTEXT
   - `provider`: VARCHAR(50)
   - `model`: VARCHAR(100)
   - `token_usage`: JSON (`inputTokens`, `outputTokens`, `totalTokens`)
   - `created_at`: TIMESTAMP
4. **`provider_configs`**:
   - `id`: INT AUTO_INCREMENT PRIMARY KEY
   - `provider_name`: VARCHAR(50)
   - `model_name`: VARCHAR(100)
   - `enabled`: BOOLEAN
   - `created_at`, `updated_at`: TIMESTAMP
5. **`usage_logs`**:
   - `id`: INT AUTO_INCREMENT PRIMARY KEY
   - `user_id`: INT (FK `users.id` ON DELETE SET NULL)
   - `conversation_id`: INT (FK `conversations.id` ON DELETE SET NULL)
   - `provider`: VARCHAR(50)
   - `model`: VARCHAR(100)
   - `input_tokens`, `output_tokens`, `total_tokens`: INT
   - `created_at`: TIMESTAMP

---

## Environment Setup

Create `.env` by copying `.env.example`:

```bash
cp .env.example .env
```

### Configuration Variables

```env
# Backend Server Configuration
PORT=5002
CLIENT_URL=http://localhost:5173

# MySQL Configuration (Container mapped to host port 3309)
DB_HOST=127.0.0.1
DB_PORT=3309
DB_NAME=ai_chatbot
DB_USER=root
DB_PASSWORD=password123

# phpMyAdmin Port
PMA_PORT=8090

# AI Provider Keys (Kept strictly on Node.js backend)
HF_API_KEY=your_huggingface_api_key_here
HF_MODEL=meta-llama/Llama-3.2-3B-Instruct

OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=nex-agi/nex-n2.5-mini:free

BOTPRESS_BOT_ID=your_botpress_bot_id_here
BOTPRESS_API_KEY=your_botpress_api_key_here
BOTPRESS_WORKSPACE_ID=your_botpress_workspace_id_here
```

---

## Step-by-Step Local Setup

### 1. Launch Docker Services (MySQL & phpMyAdmin)
```bash
docker compose up -d
```
- **MySQL**: Accessible on port `3309`
- **phpMyAdmin**: Accessible at [http://localhost:8090](http://localhost:8090)
  - **Server**: `mysql`
  - **Username**: `root`
  - **Password**: `password123`

### 2. Install Backend Dependencies & Start Server
```bash
cd server
npm install
npm run dev
```
Backend starts on [http://localhost:5002](http://localhost:5002).

### 3. Install Frontend Dependencies & Start Client
Open a second terminal window in the project root:
```bash
npm install
npm run dev
```
Frontend starts on [http://localhost:5173](http://localhost:5173).

---

## API Reference

### Health & Provider Endpoints
- `GET /api/health` — Checks database connectivity and provider configuration status.
- `GET /api/providers` — Lists supported providers with badges and readiness.
- `GET /api/providers/openrouter/models` — Fetches active OpenRouter models (prioritizing free and popular models).
- `GET /api/providers/huggingface/models` — Lists supported Hugging Face inference models.

### Chat Endpoints
- **Unified Chat**: `POST /api/chat`
  ```json
  {
    "provider": "openrouter",
    "model": "nex-agi/nex-n2.5-mini:free",
    "conversationId": 1,
    "message": "Explain recursion in programming."
  }
  ```
- **Provider-Specific Endpoints**:
  - `POST /api/chat/openrouter`
  - `POST /api/chat/huggingface`
  - `POST /api/chat/botpress`

### Conversation Management
- `GET /api/conversations` — Retrieves all conversations for the user.
- `POST /api/conversations` — Creates a new empty conversation.
- `GET /api/conversations/:id` — Gets details of a conversation.
- `PATCH /api/conversations/:id` — Updates conversation title or model.
- `DELETE /api/conversations/:id` — Deletes conversation and all its messages.
- `GET /api/conversations/:id/messages` — Retrieves all messages for a conversation.
- `GET /api/conversations/search?q=query` — Searches conversations by title or message content.

---

## AI Providers Setup Guide

### 1. OpenRouter
1. Create an account at [openrouter.ai](https://openrouter.ai/).
2. Navigate to **Keys** and create a new API key.
3. Paste the key into `.env`:
   ```env
   OPENROUTER_API_KEY=sk-or-v1-...
   ```
4. OpenRouter supports hundreds of models, including free open-source models such as `nex-agi/nex-n2.5-mini:free`.

### 2. Hugging Face
1. Create a free account at [huggingface.co](https://huggingface.co/).
2. Go to **Settings -> Access Tokens** and generate a token with `read` permissions.
3. Add to `.env`:
   ```env
   HF_API_KEY=hf_...
   HF_MODEL=meta-llama/Llama-3.2-3B-Instruct
   ```

### 3. Botpress
1. Sign in to [botpress.com](https://botpress.com/) and open your Botpress Cloud dashboard.
2. Under **Bot Settings**, copy your `Bot ID` and generate a Personal Access Token or Bot API Key.
3. Add to `.env`:
   ```env
   BOTPRESS_BOT_ID=...
   BOTPRESS_API_KEY=...
   ```

---

## Troubleshooting

- **Database Connection Refused**:
  - Verify Docker is running: `docker ps`
  - Check container status: `docker logs ai_chatbot_mysql`
  - Verify port `3309` is free.
- **OpenRouter "Insufficient Credits"**:
  - When using non-free models (e.g., `openai/gpt-4o`), your OpenRouter account must have credits.
  - For zero-cost testing, select any of the **(Free)** models from the model dropdown (such as `nex-agi/nex-n2.5-mini:free`).
- **phpMyAdmin Access**:
  - Ensure you visit `http://localhost:8090` and log in with user `root` and password `password123`.
