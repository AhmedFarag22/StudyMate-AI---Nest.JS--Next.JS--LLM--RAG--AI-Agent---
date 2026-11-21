
<div align="center">

# StudyMate AI

### Your Personal AI Study Assistant — Powered by RAG, Vector Search & Autonomous Agents

Upload your study materials. Ask questions. Get context-grounded answers with source references. Let an AI agent turn your learning goals into actionable study tasks.

![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/Backend-NestJS-E0234E?logo=nestjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Frontend-Next.js-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/UI-React_19-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![pgvector](https://img.shields.io/badge/Vector_Search-pgvector-336791)
![OpenAI](https://img.shields.io/badge/AI-OpenAI-412991?logo=openai&logoColor=white)

</div>

---

## Overview

**StudyMate AI** is a full-stack AI-powered study assistant designed to transform how students interact with their learning materials.

Instead of switching between PDF readers, AI chatbots, and task management applications, StudyMate brings everything together in one intelligent workspace.

Users can upload PDF documents, ask questions about their content, receive AI-generated answers grounded in retrieved document passages, and use an autonomous AI agent to search study materials and create study tasks.

The application combines modern Full Stack Development with practical AI Engineering concepts, including:

- Retrieval-Augmented Generation (RAG).
- Semantic Search and Vector Embeddings.
- AI Agents and Function Calling.
- Context-Grounded LLM Responses.
- PostgreSQL and pgvector.
- Modular Backend Architecture.
- Application Observability and Testing.

## Key Features

### 1. AI-Powered Document Understanding

- Upload PDF study materials.
- Extract text automatically from uploaded documents.
- Split documents into smaller overlapping chunks.
- Generate vector embeddings for each chunk.
- Ask natural-language questions about uploaded materials.
- Retrieve relevant passages using semantic similarity.
- Generate answers grounded in retrieved document context.
- Return source references, including filenames and chunk indexes.

### 2. Retrieval-Augmented Generation (RAG)

StudyMate implements an end-to-end RAG pipeline that allows the LLM to answer questions using the user's own documents instead of relying only on its pretrained knowledge.

The pipeline includes:

- PDF text extraction using `pdf-parse`.
- Recursive character-based chunking.
- Embedding generation using `text-embedding-3-small`.
- Vector storage using PostgreSQL and pgvector.
- Cosine similarity search.
- Top-K context retrieval.
- Context-aware answer generation.
- Structured source references.

### 3. Autonomous AI Agent

StudyMate includes an AI agent powered by OpenAI Function Calling.

Unlike a traditional chatbot, the agent can interact with backend services through predefined tools.

Available tools:

| Tool | Description |
|---|---|
| `searchStudyDocuments` | Searches uploaded study materials to retrieve relevant information. |
| `createStudyTask` | Creates a study task with a title and due date. |

The agent can:

- Understand user requests.
- Determine when a tool is needed.
- Search uploaded documents.
- Create study tasks.
- Process tool execution results.
- Generate a final natural-language response.

The application executes tool calls through NestJS services rather than allowing the LLM to access the database directly.

### 4. Study Task Management

- Create study tasks with due dates.
- Retrieve existing tasks.
- Organize tasks by due date.
- Identify overdue tasks.
- Track task completion status.

### 5. General AI Chat

- Ask general questions without requiring uploaded documents.
- Get AI-generated responses through OpenAI.
- Use a separate context-aware document question-answering workflow when working with uploaded materials.

---

## Architecture

StudyMate follows a modular full-stack architecture that separates the frontend, backend services, AI integrations, and data persistence.

```text
                  STUDYMATE AI
                       |
          +------------+------------+
          |                         |
          v                         v
    NEXT.JS FRONTEND           NESTJS BACKEND
       Port 3000                 Port 4000
          |                         |
          |                    +----+------+
          |                    |           |
          |                    v           v
          |                 AI MODULE   DOCUMENTS
          |                    |           |
          |              +-----+-----+     |
          |              |     |     |     |
          |              v     v     v     v
          |             AI   AGENT  EMBED  RAG
          |                                |
          |                                |
          |                    +-----------+
          |                    |
          |                    v
          |                TASKS MODULE
          |                    |
          +------ REST API ----+
                               |
                               v
                       DATABASE MODULE
                               |
                  +------------+------------+
                  |            |            |
                  v            v            v
              PostgreSQL    pgvector     Observe
                  |            |
                  v            v
               Documents    Embeddings
               Chunks       Vector Search
               Tasks
                  |
                  v
               OPENAI API
             Chat + Embeddings
```

### Backend Modules

| Module | Responsibility |
|---|---|
| AI Module | General AI chat, context-aware responses, embedding generation, and agent orchestration. |
| Documents Module | PDF uploads, text extraction, chunking, embeddings, semantic search, and RAG processing. |
| Tasks Module | Study task creation and retrieval. |
| Database Module | PostgreSQL connection pooling and database access. |
| Observe Module | Application instrumentation, distributed tracing, metrics, logs, and error monitoring. |

---

## RAG Pipeline

### Document Ingestion

When a user uploads a PDF, the backend performs the following operations:

```text
       PDF UPLOAD
            |
            v
      FILE VALIDATION
            |
            v
      TEXT EXTRACTION
         pdf-parse
            |
            v
        CHUNKING
      1000 Characters
      200 Overlap
            |
            v
    EMBEDDING GENERATION
   text-embedding-3-small
            |
            v
      VECTOR STORAGE
       PostgreSQL
        pgvector
            |
            v
       HNSW INDEX
```

### Question Answering

When a user asks a question:

```text
       USER QUESTION
             |
             v
      QUESTION EMBEDDING
             |
             v
      VECTOR SIMILARITY
          SEARCH
             |
             v
       TOP 5 CHUNKS
             |
             v
      CONTEXT ASSEMBLY
             |
             v
       LLM GENERATION
          GPT-4.1-mini
             |
             v
       FINAL ANSWER
             |
             v
     SOURCE REFERENCES
```

### RAG Configuration

| Parameter | Value |
|---|---|
| Chunk Size | 1000 Characters |
| Chunk Overlap | 200 Characters |
| Retrieval Strategy | Top-K Similarity Search |
| Default Top-K | 5 |
| Embedding Model | text-embedding-3-small |
| Embedding Dimensions | 1536 |
| Similarity Metric | Cosine Distance |
| Vector Index | HNSW |
| Generation Model | gpt-4.1-mini |

---

## Vector Database & Semantic Search

StudyMate uses PostgreSQL with the pgvector extension to store and retrieve document embeddings.

Each document chunk is represented by a 1536-dimensional vector.

The application uses cosine distance to retrieve semantically similar content.

Example SQL query:

```sql
SELECT
    dc.content,
    dc.chunk_index,
    d.filename,
    dc.embedding <=> $1::vector AS distance
FROM document_chunks dc
JOIN documents d
    ON d.id = dc.document_id
ORDER BY dc.embedding <=> $1::vector
LIMIT $2;
```

### Database Design

The database contains three core tables:

| Table | Purpose |
|---|---|
| `documents` | Stores uploaded document metadata. |
| `document_chunks` | Stores extracted text chunks and vector embeddings. |
| `study_tasks` | Stores study tasks, due dates, and completion information. |

Additional database features:

- UUID primary keys.
- Foreign key relationships.
- Cascade deletion for document chunks.
- PostgreSQL connection pooling.
- HNSW vector indexing.
- Task due-date indexing.
- Parameterized SQL queries.

---

## AI Agent Architecture

The AI agent uses OpenAI's native Function Calling capabilities to interact with application services.

### Available Tools

**1. searchStudyDocuments**

Searches uploaded documents using semantic similarity and returns relevant chunks.

**2. createStudyTask**

Creates a study task using the supplied title and due date.

### Agent Execution Flow

```text
           USER MESSAGE
                 |
                 v
          OPENAI MODEL
                 |
                 v
        TOOL SELECTION
                 |
          +------+------+
          |             |
          v             v
      SEARCH DOCS   CREATE TASK
          |             |
          v             v
    DOCUMENT SERVICE  TASK SERVICE
          |             |
          +------+------+
                 |
                 v
          TOOL RESULTS
                 |
                 v
        SECOND LLM CALL
                 |
                 v
         FINAL RESPONSE
```

### Implementation Details

- OpenAI native function calling.
- Strict function schemas using `strict: true`.
- Automatic tool selection using `tool_choice: "auto"`.
- Tool argument parsing and execution.
- Service-based tool routing.
- Tool execution results returned to the model.
- Final response generation using tool results.

This architecture separates AI reasoning from actual application execution, keeping database operations under backend control.

---

## Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| Next.js | Frontend framework and App Router |
| React 19 | UI components and state management |
| TypeScript | Type-safe development |
| Tailwind CSS 4 | Responsive UI styling |
| DM Sans | Application typography |

### Backend

| Technology | Purpose |
|---|---|
| NestJS | Modular backend architecture |
| TypeScript | Strictly typed server-side development |
| Node.js | Runtime environment |
| PostgreSQL | Relational database |
| pgvector | Vector storage and semantic search |
| OpenAI SDK | LLM integration and function calling |
| pdf-parse | PDF text extraction |
| class-validator | DTO validation support |
| NestJS Observe | Application observability |

### AI & LLM

| Technology | Purpose |
|---|---|
| GPT-4.1-mini | AI chat, RAG generation, and agent reasoning |
| text-embedding-3-small | Document and question embeddings |
| OpenAI Function Calling | Agent tool execution |
| RAG | Document-grounded question answering |
| Vector Search | Semantic information retrieval |

### Development & Testing

| Technology | Purpose |
|---|---|
| Vitest | Backend unit and E2E testing |
| Oxlint | Backend linting |
| ESLint | Frontend linting |
| Prettier | Code formatting |
| Environment Variables | Application configuration and secret management |

---

## API Reference

### AI Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/ai/chat` | General AI chat. |
| POST | `/ai/agent` | AI agent with function-calling capabilities. |

### Document Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/documents/upload` | Upload and process PDF documents. |
| POST | `/documents/ask` | Ask questions using uploaded document context. |

Example request:

```json
{
  "question": "Explain the main concepts in this document."
}
```

Example response:

```json
{
  "answer": "The generated answer based on retrieved document content.",
  "sources": [
    {
      "filename": "study-material.pdf",
      "chunkIndex": 3
    }
  ]
}
```

### Task Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/tasks` | Retrieve study tasks. |
| POST | `/tasks` | Create a new study task. |

Example request:

```json
{
  "title": "Review Chapter 3",
  "dueDate": "2026-12-01"
}
```

---

## Frontend Experience

The application provides a single-page dashboard organized into three workspaces.

### Chat Workspace

- AI conversation interface.
- Suggested prompts.
- User and assistant message bubbles.
- Document source references.
- Loading indicators.
- Automatic scrolling.
- Enter-to-send interaction.

### Documents Workspace

- PDF upload interface.
- Uploaded document listing.
- Document status display.
- File validation.

### Tasks Workspace

- Task creation form.
- Due-date selection.
- Tasks sorted by due date.
- Overdue task indicators.
- Completion status.

---

## Security Considerations

The application includes several security-oriented implementation decisions.

| Area | Implementation |
|---|---|
| SQL Injection | Parameterized PostgreSQL queries. |
| File Upload | PDF MIME-type validation and 10 MB upload limit. |
| Prompt Injection | Uploaded document content is treated as untrusted data. |
| Grounded Responses | The LLM is instructed to answer using supplied document context. |
| Unsupported Answers | The model is instructed to acknowledge when information is unavailable. |
| Secrets | Environment-based configuration. |
| XSS | React's default JSX escaping. |

**Production hardening roadmap:**

- Authentication and authorization.
- API rate limiting.
- Production CORS configuration.
- Comprehensive request validation.
- Database backup policies.
- Production deployment security controls.

---

## Observability & Testing

### Observability

The backend integrates NestJS Observe for application monitoring.

Supported instrumentation includes:

- Distributed tracing.
- Request and database instrumentation.
- Performance metrics.
- Latency monitoring.
- Structured logs.
- Trace correlation.
- Error tracking.
- Configurable alerts.

### Backend Testing

Vitest is used for backend testing.

Test organization includes:

- AI service unit tests.
- Agent service unit tests.
- Documents service unit tests.
- Tasks service unit tests.
- Controller E2E tests.
- OpenAI mocking.

Run tests:

```bash
npm run test
```

Watch mode:

```bash
npm run test:watch
```

Coverage:

```bash
npm run test:cov
```

E2E tests:

```bash
npm run test:e2e
```

---

## Getting Started

### Prerequisites

- Node.js 22+
- npm
- Docker
- PostgreSQL with pgvector
- OpenAI API Key

### 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd "StudyMate AI"
```

### 2. Start PostgreSQL with pgvector

```bash
docker run -d \
  --name studymate-postgres \
  -e POSTGRES_DB=studymate \
  -e POSTGRES_USER=studymate \
  -e POSTGRES_PASSWORD=studymate \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```

Enable the vector extension:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Create the required database tables and indexes using the schema described above.

### 3. Configure the Backend

```bash
cd studymate-backend
npm install
```

Create a `.env` file:

```env
DATABASE_URL=postgresql://studymate:studymate@localhost:5432/studymate
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4.1-mini

# Optional: NestJS Observe
OBSERVE_APP_KEY=
OBSERVE_APP_SECRET=
```

Start the backend:

```bash
npm run start:dev
```

Backend URL:

```text
http://localhost:4000
```

### 4. Configure the Frontend

Open another terminal:

```bash
cd studymate-frontend
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Start the frontend:

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:3000
```

Open the application and start studying!

---

## Project Structure

```text
StudyMate AI/
│
├── studymate-backend/
│   │
│   ├── src/
│   │   ├── ai/
│   │   │   ├── ai.module.ts
│   │   │   ├── ai.controller.ts
│   │   │   ├── ai.service.ts
│   │   │   ├── agent.service.ts
│   │   │   └── embedding.service.ts
│   │   │
│   │   ├── documents/
│   │   │   ├── documents.module.ts
│   │   │   ├── documents.controller.ts
│   │   │   ├── documents.service.ts
│   │   │   ├── chunking.ts
│   │   │   └── uploaded-pdf.interface.ts
│   │   │
│   │   ├── tasks/
│   │   │   ├── tasks.module.ts
│   │   │   ├── tasks.controller.ts
│   │   │   └── tasks.service.ts
│   │   │
│   │   ├── database/
│   │   │   └── database.module.ts
│   │   │
│   │   ├── app.module.ts
│   │   └── main.ts
│   │
│   └── test/
│
├── studymate-frontend/
│   │
│   ├── app/
│   │   ├── components/
│   │   │   └── UploadDocument.tsx
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── public/
│   └── package.json
│
└── README.md
```

---

## Future Roadmap

The following improvements are planned for future development.

### Phase 1 — Core Enhancements

- [ ] Streaming AI responses using SSE.
- [ ] Persistent chat sessions and conversation history.
- [ ] Document listing, deletion, and re-processing.
- [ ] DOCX, TXT, and Markdown support.

### Phase 2 — Advanced RAG

- [ ] Hybrid search combining keyword and vector retrieval.
- [ ] LLM-based query rewriting.
- [ ] Cross-encoder reranking.
- [ ] Improved inline source citations.

### Phase 3 — Agentic Learning Workflows

- [ ] AI-generated study plans.
- [ ] Automatic quiz generation.
- [ ] Study progress analytics.
- [ ] Learning streak tracking.
- [ ] Multi-agent workflows.

### Phase 4 — Platform Expansion

- [ ] Authentication and authorization.
- [ ] Multi-tenant workspaces.
- [ ] Shared study documents.
- [ ] Mobile application.
- [ ] Browser extension.

---

## Project Statistics

| Metric | Value |
|---|---:|
| Backend Modules | 5 |
| REST API Endpoints | 6 |
| Database Tables | 3 |
| Vector Dimensions | 1536 |
| Default Retrieval Size | Top 5 |
| Chunk Size | 1000 Characters |
| Chunk Overlap | 200 Characters |
| AI Agent Tools | 2 |
| Main AI Capabilities | RAG, Semantic Search, Function Calling |

---

## Engineering Highlights

StudyMate AI demonstrates practical implementation of modern AI-powered application architecture.

**Full Stack Engineering**
- Building a complete application using Next.js, React, NestJS, and TypeScript.
- Designing frontend-to-backend REST API integration.
- Implementing modular and maintainable application structure.

**AI Engineering**
- Integrating LLMs into real application workflows.
- Implementing Retrieval-Augmented Generation from scratch.
- Generating and storing vector embeddings.
- Performing semantic search using pgvector.
- Building an AI agent with native function calling.
- Connecting LLM tool calls to actual backend services.

**Backend Engineering**
- Modular NestJS architecture.
- Dependency injection.
- PostgreSQL schema design.
- Connection pooling.
- Parameterized queries.
- Document processing pipelines.
- Backend testing and observability.

---

## Why StudyMate AI?

StudyMate is more than a chatbot connected to an LLM API.

It demonstrates how to build an actual AI-powered product by combining:

- A real user-facing application.
- A complete document ingestion pipeline.
- Semantic retrieval and vector search.
- Context-grounded AI responses.
- An autonomous agent capable of executing application tools.
- Persistent relational data.
- Modular backend architecture.
- Testing and observability.

The goal is simple:

**Turn static study materials into an interactive, intelligent, and organized learning experience.**

---

<div align="center">

### Study Smarter. Understand Faster. Stay Organized.

**Built with TypeScript, NestJS, Next.js, PostgreSQL, pgvector & OpenAI.**

</div>
