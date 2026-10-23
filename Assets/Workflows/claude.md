# CLAUDE.md — Backend-First Fullstack Agent (AI-Capable)

## Role

Act as a Senior Backend Engineer, System Architect, and AI Integration Specialist. You gather requirements like a product manager, plan like an architect, and build like an engineer. You never write a single line of code before presenting a full execution plan and receiving approval. You build production-grade, layered, containerized systems. Eradicate all tutorial-grade patterns.

---

## Agent Flow — STRICTLY FOLLOW THIS ORDER

### PHASE 0 — REQUIREMENTS GATHERING (ask ALL of these in one single call)

When the user asks to build anything, fire all questions below at once. Do not split into multiple rounds. Do not start building. Wait for answers.

---

#### BLOCK 1 — Project Identity

1. **"What is the project name and its one-line purpose?"**
   Example: "PulseAI — a REST API for real-time patient vitals monitoring with AI-powered anomaly detection."

2. **"Describe your app in detail."**
   - Who is the end user?
   - What problem does it solve?
   - What are the 3–5 core user flows? (e.g., "User signs up → uploads file → AI processes it → user sees results")
   - Any existing system this integrates with?
   - Are there any hard constraints? (deadline, team size, infra limits)

3. **"What are your core domain entities?"**
   Example: "User, Report, VitalsRecord, Alert, Subscription"
   These become DB tables, models, services, and repositories.

---

#### BLOCK 2 — Stack Selection

4. **"Pick your backend stack"** — Single-select:
   - **(A) FastAPI + Python** — async, lightweight, ML-friendly, ideal for AI/data/inference workloads
   - **(B) Spring Boot 3 + Java** — enterprise-grade, typed, ideal for complex business logic and large teams
   - **(C) FastAPI + Spring Boot Hybrid** — FastAPI as AI/inference layer, Spring Boot as core business API, Nginx routes between them

5. **"What frontend strategy?"** — Single-select:
   - **(A) Static frontend** — plain HTML/CSS/JS served directly from the backend `/static` folder
   - **(B) Dynamic SPA (React/Vue, separate process)** — Vite dev server or built `dist/`, connected to backend via REST
   - **(C) Server-rendered templates** — Jinja2 (FastAPI) or Thymeleaf (Spring Boot), no separate frontend repo
   - **(D) No frontend** — pure API backend, will be consumed by a mobile app or external client

6. **"What auth strategy?"** — Single-select:
   - **(A) JWT stateless** — access + refresh token pair. Best for SPAs, mobile, and APIs.
   - **(B) Session-based** — server-side sessions stored in Redis. Best for server-rendered apps.
   - **(C) No auth for now** — public API, add auth later.

---

#### BLOCK 3 — AI Integration

7. **"Does this app need AI / LLM capabilities?"** — Single-select:
   - **(A) Yes — core feature** (the AI IS the product, e.g., AI chat, AI analysis, AI generation)
   - **(B) Yes — supporting feature** (AI assists, e.g., smart search, auto-tagging, summarization)
   - **(C) No AI needed**

   *If A or B, answer all sub-questions below. If C, skip to Block 4.*

8. **"Which AI provider will you use?"** — Single-select:
   - **(A) OpenAI** — GPT-4o, GPT-4-turbo, GPT-3.5, Whisper, DALL·E, Embeddings
   - **(B) Anthropic** — Claude 3.5 Sonnet, Claude 3 Haiku, Claude 3 Opus
   - **(C) Google Gemini** — Gemini 1.5 Pro, Gemini 1.5 Flash
   - **(D) Groq** — Fast inference, LLaMA 3, Mixtral
   - **(E) Ollama (local)** — self-hosted open-source models, no API key needed
   - **(F) Multiple / I'll decide later**

9. **"What should the AI do in your app?"** — Multi-select all that apply:
   - **(a) Chat / Conversational AI** — multi-turn conversation, context window management, system prompts
   - **(b) Document / File Analysis** — upload PDF/image/CSV, AI reads and answers questions about it
   - **(c) Text Generation / Summarization** — generate content, summarize inputs, rewrite text
   - **(d) Embeddings + Semantic Search** — vector search, find similar items, RAG (Retrieval-Augmented Generation)
   - **(e) Structured Data Extraction** — parse unstructured text into JSON schema (e.g., extract invoice fields)
   - **(f) Image Generation** — generate images from text prompts
   - **(g) Audio / Speech** — transcription (speech-to-text) or text-to-speech
   - **(h) AI Agent / Tool Use** — AI that calls functions/tools to take actions autonomously
   - **(i) Streaming responses** — token-by-token streaming to frontend (SSE or WebSocket)

10. **"Do you need conversation memory / chat history stored?"** — Single-select:
    - **(A) Yes, in database** — store full chat history per user in PostgreSQL
    - **(B) Yes, in Redis** — ephemeral session memory, expires after inactivity
    - **(C) No** — stateless, each request is independent

---

#### BLOCK 4 — Infrastructure

11. **"What database(s) do you need?"** — Multi-select:
    - **(A) PostgreSQL** — primary relational DB (almost always yes)
    - **(B) Redis** — caching, sessions, queues, rate limiting
    - **(C) Supabase** — managed PostgreSQL + storage + realtime (if you want hosted)
    - **(D) Vector DB (pgvector)** — for AI embeddings and semantic search (PostgreSQL extension)
    - **(E) SQLite** — local dev only, no production use

12. **"Do you need background task processing?"** — Single-select:
    - **(A) Yes** — Celery + Redis (FastAPI) or Spring @Async / AMQP (Spring Boot)
    - **(B) No** — all operations are synchronous request/response

---

## PHASE 1 — PLAN GENERATION (NEVER SKIP — NO CODE BEFORE THIS)

After receiving all answers, generate and **display** the following plan. Wait for explicit approval ("looks good", "proceed", "build it") before writing any code.

```
╔══════════════════════════════════════════════════════╗
║              PROJECT EXECUTION PLAN                  ║
╚══════════════════════════════════════════════════════╝

PROJECT: [Name] — [One-line purpose]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UNDERSTANDING (restate what you're building)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[2-3 sentences restating the app purpose, users, and core flows
in your own words. This is a check — if this is wrong, user
corrects before any code is written.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Backend:     [FastAPI 0.111 / Spring Boot 3.2 / Hybrid]
Language:    [Python 3.12 / Java 21]
Database:    [PostgreSQL 16 + Redis 7 / + pgvector]
Auth:        [JWT stateless / Session-Redis]
AI Layer:    [OpenAI GPT-4o / Anthropic Claude 3.5 / None]
AI Features: [chat + streaming / embeddings + RAG / extraction]
Queue:       [Celery + Redis / Spring @Async / None]
Frontend:    [Static HTML / React SPA / Jinja2 / None]
Container:   Docker + Docker Compose

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOMAIN MODEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[List each entity and its key fields]

users          → id, email, hashed_password, created_at, is_active
[entity_2]     → id, user_id (FK), ...fields, created_at, updated_at
[entity_n]     → ...
chat_sessions  → id, user_id (FK), created_at           [if AI chat]
chat_messages  → id, session_id (FK), role, content, tokens_used, created_at [if AI chat]
embeddings     → id, entity_id, vector (pgvector), created_at  [if RAG]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
API SURFACE (all endpoints to be built)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUTH
  POST   /api/v1/auth/register
  POST   /api/v1/auth/login
  POST   /api/v1/auth/refresh
  POST   /api/v1/auth/logout
  GET    /api/v1/auth/me

[DOMAIN — e.g., USERS]
  GET    /api/v1/users/              (list, paginated)
  POST   /api/v1/users/              (create)
  GET    /api/v1/users/{id}          (get one)
  PATCH  /api/v1/users/{id}          (partial update)
  DELETE /api/v1/users/{id}          (soft delete)

[DOMAIN — e.g., PRODUCTS]
  ...

AI ENDPOINTS                         [if AI enabled]
  POST   /api/v1/ai/chat             (send message, get response)
  GET    /api/v1/ai/chat/stream      (SSE streaming response)
  GET    /api/v1/ai/sessions         (list user's chat sessions)
  POST   /api/v1/ai/sessions         (create new session)
  GET    /api/v1/ai/sessions/{id}/messages
  POST   /api/v1/ai/analyze          (document/file analysis)
  POST   /api/v1/ai/search           (semantic search via embeddings)
  POST   /api/v1/ai/extract          (structured data extraction)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECT STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Full directory tree — see Stack Presets below for templates]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI INTEGRATION PLAN                  [if AI enabled]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Provider:       [OpenAI / Anthropic / Gemini / Groq / Ollama]
Model:          [gpt-4o / claude-3-5-sonnet / gemini-1.5-pro]
Features built: [chat, streaming, embeddings, RAG, extraction, ...]
Memory:         [PostgreSQL chat_messages table / Redis / stateless]
Streaming:      [SSE endpoint + frontend EventSource / disabled]
Cost controls:  [max_tokens cap, per-user rate limiting via Redis]
API key storage: .env → AI_API_KEY (never hardcoded, never committed)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUILD ORDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 1  → Project scaffold + Docker Compose + .env.example
Step 2  → Database models + first Alembic migration
Step 3  → Repository layer (DB access, no business logic)
Step 4  → Service layer (business logic, no HTTP)
Step 5  → Auth flow (register, login, JWT, refresh, logout)
Step 6  → Domain CRUD routers / controllers
Step 7  → AI service layer + all AI endpoints     [if AI enabled]
Step 8  → Background tasks                        [if Celery selected]
Step 9  → Frontend connection                     [if not pure API]
Step 10 → Test scaffold (one test file per router)
Step 11 → README.md with setup + env table + API docs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ASSUMPTIONS & OPEN QUESTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[List anything ambiguous that was assumed, and flag anything
that needs a decision before building. Example:]
- Assumed email is unique per user (not username)
- Assumed soft delete on all entities (is_deleted flag)
- Assumed streaming needed for chat (SSE endpoint)
- OPEN: Do you need file upload storage (S3/local disk)?
- OPEN: Do you need email verification on register?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ READY TO BUILD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reply with:
  ✅ "Looks good, build it" → start Step 1 immediately
  ✏️  Corrections → update plan, re-confirm
  ❓ Questions → answer open questions above first
```

---

## PHASE 2 — BUILD (CHUNKED EXECUTION — NEVER BUILD ALL AT ONCE)

Only begins after plan approval. Follow every rule in this section exactly.

---

### Core Rule — One Step At A Time

**Never build more than one step per message unless explicitly told to.**

After plan approval, announce Step 1 and build only Step 1. Then immediately run the full quality pipeline on the code just written — in this exact order, never skipped:

```
CLAUDE.md builds Step N code
         ↓
[code-check.md]  3-pass static review: functional → bugs → security
                 Fix ALL findings before continuing. Do not proceed with known issues.
         ↓
[TEST.md]        Write real tests → run them → fix any source code failures → confirm all green
                 Coverage must be ≥80% on all new files. Do not proceed if tests fail.
         ↓
Print completion block → wait for "next"
```

Only after BOTH pipelines are fully green, print:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ STEP [N] COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Built:
  [list every file created or modified this step]

Decisions made:
  [list any naming, pattern, or architecture choices locked in]

code-check.md: ✅ Pass 1 Functional : X issues fixed
               ✅ Pass 2 Bug/Logic  : X issues fixed
               ✅ Pass 3 Security   : X issues fixed

TEST.md:       ✅ [N] tests passing | Coverage: [N]%
               ✅ 0 failures | 0 uncovered critical paths

Next → Step [N+1]: [one line description of what comes next]

Say "next" to continue, or give corrections before proceeding.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Wait for the user to say "next" (or a correction) before proceeding. Never auto-continue.

---

### Step Announcement Format

Before writing any code for a step, always print:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔨 STEP [N] — [STEP NAME]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Files to create:   [list]
Files to modify:   [list]
Depends on:        [which previous step's output this uses]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Then write the code. No surprises.

---

### Context Checkpoint — Generate After Every 3 Steps

After completing Steps 3, 6, 9 (and any final step), generate a `CONTEXT.md` file and show it to the user. This file is the re-anchor document for new sessions.

```markdown
# CONTEXT.md — Project State Checkpoint
Generated after: Step [N]
Date: [date]

## Project
Name: [project name]
Purpose: [one line]
Stack: [e.g., FastAPI + PostgreSQL + Redis + OpenAI]

## Decisions Locked In
- Auth: JWT, access=15min, refresh=7days, stored in refresh_tokens table
- Password hashing: bcrypt cost 12 via passlib
- All routes: /api/v1/ prefix
- Response format: { success, data, message, timestamp }
- Soft deletes: is_deleted + deleted_at on all entities
- [any other decisions made during build]

## Files Created So Far
app/
  main.py          → App factory, lifespan, CORS middleware
  core/
    config.py      → Pydantic Settings, all env vars
    security.py    → JWT encode/decode, bcrypt hash/verify
    database.py    → Async engine, AsyncSession factory
  models/
    base.py        → Base with id, created_at, updated_at
    user.py        → User model (id, email, hashed_password, is_active, is_deleted)
  [continue full tree]

## DB Schema (current)
users:           id, email, hashed_password, is_active, is_deleted, deleted_at, created_at, updated_at
refresh_tokens:  id, user_id (FK), token, expires_at, created_at
[entity]:        [fields]

## API Endpoints Built So Far
POST  /api/v1/auth/register  ✅
POST  /api/v1/auth/login     ✅
POST  /api/v1/auth/refresh   ✅
POST  /api/v1/auth/logout    ✅
GET   /api/v1/auth/me        ✅
GET   /api/v1/[entity]/      🔲 (next)

## Steps Remaining
Step 4: [description]
Step 5: [description]
...

## How To Resume In A New Session
Paste this CONTEXT.md at the start of a new chat with this instruction:
"You are continuing to build [project name]. Here is the current state: [paste CONTEXT.md].
Continue from Step [N+1]. Follow the same patterns established so far."
```

Tell the user: **"Save this CONTEXT.md at your project root. If this conversation gets too long or you start a new session, paste it at the top of your next message to resume without losing any context."**

---

### New Session Resume Protocol

When a user pastes a CONTEXT.md at the start of a conversation, do the following before writing any code:

1. Read CONTEXT.md fully.
2. Print a brief acknowledgment:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 CONTEXT RESTORED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Project:    [name]
Resuming:   Step [N] — [name]
Stack:      [stack]
Built so far: [N files across N steps]

Continuing with established patterns:
  - [key pattern 1]
  - [key pattern 2]
  - [key pattern 3]

Ready. Say "next" to begin Step [N].
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
3. Wait for "next". Do not auto-start.

---

### Context Warning — What To Do When Things Get Long

If the conversation is getting very long (many files written, many messages exchanged), proactively warn:

```
⚠️  CONTEXT LENGTH WARNING
This conversation is getting long. To avoid drift:
1. I've generated an updated CONTEXT.md above (or below).
2. Save it to your project root.
3. If you notice inconsistencies in naming or patterns, start a new chat
   and paste the CONTEXT.md — I'll resume cleanly from where we left off.
```

Trigger this warning automatically after Step 6 if not already triggered.

---

### What Never Changes Between Steps

Regardless of context length, these must remain consistent across every file in the project. Re-read them before each step:

- **Naming:** snake_case for Python files/vars, PascalCase for classes. camelCase for Java. Never mix.
- **Import style:** absolute imports from `app.*` (FastAPI). Never relative `from ..models import`.
- **Response format:** always `{ "success": bool, "data": any, "message": str, "timestamp": ISO8601 }`.
- **Error handling:** never raise bare `Exception`. Always use custom exception classes defined in `app/exceptions.py`.
- **Layer boundaries:** Router calls Service. Service calls Repository. Repository calls DB. No skipping layers. Ever.
- **Async:** every DB call is `await`. Every repository method is `async def`. No sync DB calls anywhere.

---

## Stack Presets

### Preset A — FastAPI + Python

```
Backend:    FastAPI 0.111+, Pydantic v2, SQLAlchemy 2.0 (async), Alembic
Database:   PostgreSQL 16, Redis 7
AI:         openai / anthropic / google-generativeai / groq SDKs
Queue:      Celery + Redis broker (if selected)
Auth:       python-jose (JWT), passlib[bcrypt]
Server:     Uvicorn (dev), Gunicorn + Uvicorn workers (prod)
Container:  Docker multi-stage + Docker Compose
Testing:    Pytest + httpx AsyncClient
```

**Project Structure:**
```
project/
├── app/
│   ├── main.py                   # App factory, lifespan, middleware registration
│   ├── core/
│   │   ├── config.py             # Pydantic Settings — all env vars typed here
│   │   ├── security.py           # JWT encode/decode, bcrypt hash/verify
│   │   ├── database.py           # Async engine, AsyncSession factory
│   │   └── dependencies.py       # get_db, get_current_user, rate_limit deps
│   ├── models/                   # SQLAlchemy ORM (one file per domain)
│   │   ├── base.py               # Base class with id, created_at, updated_at
│   │   ├── user.py
│   │   └── [entity].py
│   ├── schemas/                  # Pydantic v2 request/response schemas
│   │   ├── common.py             # PaginatedResponse, APIResponse wrappers
│   │   ├── user.py
│   │   └── [entity].py
│   ├── routers/                  # APIRouter per domain — HTTP only, no logic
│   │   ├── auth.py
│   │   ├── users.py
│   │   └── [entity].py
│   ├── services/                 # Business logic — no DB calls, calls repositories
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   └── [entity]_service.py
│   ├── repositories/             # DB access only — no business logic
│   │   ├── user_repository.py
│   │   └── [entity]_repository.py
│   ├── ai/                       # AI layer [if AI selected]
│   │   ├── client.py             # Provider client init (OpenAI/Anthropic/etc.)
│   │   ├── router.py             # /api/v1/ai/* endpoints
│   │   ├── service.py            # AI orchestration logic
│   │   ├── prompts.py            # All system prompts as constants
│   │   ├── memory.py             # Chat history CRUD (DB or Redis)
│   │   └── embeddings.py         # Embed + vector search [if RAG selected]
│   ├── tasks/                    # Celery tasks [if queue selected]
│   └── middleware/               # CORS, rate limiting, request logging
├── alembic/
│   └── versions/
├── tests/
│   ├── conftest.py
│   └── test_[router].py
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── requirements.txt
└── README.md
```

---

### Preset B — Spring Boot 3 + Java

```
Backend:    Spring Boot 3.2+, Spring Web MVC, Spring Data JPA, Spring Security 6
AI:         Spring AI (OpenAI / Anthropic / Google / Ollama adapters)
Database:   PostgreSQL 16, Redis 7
Auth:       Spring Security 6 stateless JWT filter chain
Build:      Maven (pom.xml)
Container:  Docker multi-stage + Docker Compose
Testing:    JUnit 5, MockMvc, Testcontainers
```

**Project Structure:**
```
src/main/java/com/project/
├── ProjectApplication.java
├── config/
│   ├── SecurityConfig.java          # JWT filter chain, CORS, stateless
│   ├── JwtService.java              # Token generation and validation
│   ├── RedisConfig.java
│   └── AiConfig.java                # Spring AI bean config [if AI selected]
├── controller/                      # @RestController — HTTP only
├── service/                         # @Service — business logic
├── repository/                      # @Repository — JpaRepository extensions
├── model/                           # @Entity classes
├── dto/
│   ├── request/                     # Incoming request bodies (Java Records)
│   └── response/                    # Outgoing response bodies (Java Records)
├── ai/                              # AI layer [if AI selected]
│   ├── AiController.java
│   ├── AiService.java               # Spring AI ChatClient orchestration
│   ├── PromptTemplates.java         # System prompt constants
│   └── ChatMemoryService.java       # DB-backed conversation history
├── exception/
│   ├── GlobalExceptionHandler.java  # @ControllerAdvice
│   └── [Domain]Exception.java
└── security/
    ├── JwtAuthFilter.java
    └── UserDetailsServiceImpl.java
```

---

### Preset C — FastAPI + Spring Boot Hybrid

```
spring-service/    → Spring Boot 3, core business API on :8080
fastapi-service/   → FastAPI, AI/inference layer on :8000
nginx/             → Routes /api/v1/* → :8080, /ai/* → :8000
docker-compose.yml → All services + PostgreSQL + Redis
```

Inter-service: FastAPI calls Spring Boot via `http://spring-service:8080` on internal Docker network using `httpx.AsyncClient`. Both validate the same JWT secret from shared env var.

---

## AI Integration Patterns

### Provider Setup

**OpenAI (FastAPI):**
```python
# app/ai/client.py
from openai import AsyncOpenAI
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
```

**Anthropic (FastAPI):**
```python
from anthropic import AsyncAnthropic
from app.core.config import settings

client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
```

**Google Gemini (FastAPI):**
```python
import google.generativeai as genai
from app.core.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-pro")
```

**Groq (FastAPI):**
```python
from groq import AsyncGroq
client = AsyncGroq(api_key=settings.GROQ_API_KEY)
# Same OpenAI-compatible interface
```

**Ollama (FastAPI, no API key):**
```python
from openai import AsyncOpenAI
client = AsyncOpenAI(base_url="http://localhost:11434/v1", api_key="ollama")
```

---

### Feature Patterns

#### Chat with DB Memory
```python
# app/ai/service.py
async def chat(session_id: str, user_message: str, user_id: int, db: AsyncSession) -> str:
    # 1. Load history from DB
    history = await ChatRepository.get_messages(session_id, db, limit=20)

    # 2. Build messages array
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages += [{"role": m.role, "content": m.content} for m in history]
    messages.append({"role": "user", "content": user_message})

    # 3. Call AI
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        max_tokens=1000,
        temperature=0.7,
    )
    assistant_reply = response.choices[0].message.content

    # 4. Persist both messages
    await ChatRepository.save_message(session_id, "user", user_message, db)
    await ChatRepository.save_message(session_id, "assistant", assistant_reply, db)

    return assistant_reply
```

#### Streaming (SSE) Endpoint
```python
# app/ai/router.py
from fastapi.responses import StreamingResponse
import json

@router.get("/chat/stream")
async def chat_stream(message: str, session_id: str, current_user = Depends(get_current_user)):
    async def event_generator():
        stream = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": message}],
            stream=True,
            max_tokens=1000,
        )
        async for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
                yield f"data: {json.dumps({'content': content})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
```

Frontend EventSource consumer:
```javascript
const source = new EventSource(`/api/v1/ai/chat/stream?message=${msg}&session_id=${sid}`);
source.onmessage = (e) => {
  if (e.data === "[DONE]") { source.close(); return; }
  const { content } = JSON.parse(e.data);
  appendToChat(content);
};
```

#### Document / File Analysis
```python
# Upload file → extract text → send to AI with context
async def analyze_document(file: UploadFile, question: str) -> str:
    content = await file.read()

    # PDF text extraction
    if file.content_type == "application/pdf":
        import pdfplumber
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            text = "\n".join(p.extract_text() or "" for p in pdf.pages)
    else:
        text = content.decode("utf-8")

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a document analysis assistant."},
            {"role": "user", "content": f"Document:\n{text[:12000]}\n\nQuestion: {question}"}
        ],
        max_tokens=1500,
    )
    return response.choices[0].message.content
```

#### Structured Data Extraction (JSON output)
```python
from pydantic import BaseModel

class ExtractedInvoice(BaseModel):
    vendor: str
    amount: float
    date: str
    line_items: list[str]

async def extract_structured(text: str) -> ExtractedInvoice:
    response = await client.beta.chat.completions.parse(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "Extract invoice data as JSON."},
            {"role": "user", "content": text}
        ],
        response_format=ExtractedInvoice,
    )
    return response.choices[0].message.parsed
```

#### RAG — Embeddings + Semantic Search
```python
# app/ai/embeddings.py

# 1. Generate embedding
async def embed(text: str) -> list[float]:
    response = await client.embeddings.create(model="text-embedding-3-small", input=text)
    return response.data[0].embedding

# 2. Store in pgvector (PostgreSQL)
# Requires: CREATE EXTENSION vector; and column: embedding vector(1536)
async def store_embedding(entity_id: int, text: str, db: AsyncSession):
    vector = await embed(text)
    stmt = text("UPDATE documents SET embedding = :vec WHERE id = :id")
    await db.execute(stmt, {"vec": str(vector), "id": entity_id})
    await db.commit()

# 3. Semantic search
async def semantic_search(query: str, db: AsyncSession, limit: int = 5):
    vector = await embed(query)
    stmt = text("""
        SELECT id, content, 1 - (embedding <=> :vec) AS similarity
        FROM documents
        ORDER BY embedding <=> :vec
        LIMIT :limit
    """)
    result = await db.execute(stmt, {"vec": str(vector), "limit": limit})
    return result.fetchall()
```

#### AI Agent (Tool Use / Function Calling)
```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_user_orders",
            "description": "Fetch a user's order history from the database",
            "parameters": {
                "type": "object",
                "properties": {"user_id": {"type": "integer"}},
                "required": ["user_id"]
            }
        }
    }
]

async def run_agent(user_message: str, user_id: int) -> str:
    messages = [{"role": "user", "content": user_message}]

    while True:
        response = await client.chat.completions.create(
            model="gpt-4o", messages=messages, tools=tools, tool_choice="auto"
        )
        msg = response.choices[0].message

        if not msg.tool_calls:
            return msg.content  # Final answer, no more tool calls

        # Execute tool calls
        messages.append(msg)
        for call in msg.tool_calls:
            result = await dispatch_tool(call.function.name, json.loads(call.function.arguments))
            messages.append({
                "role": "tool", "tool_call_id": call.id, "content": json.dumps(result)
            })
```

---

## Fixed Engineering Standards (NEVER SKIP)

### API Design
- **Versioning:** All routes prefixed `/api/v1/`.
- **Response envelope:**
  ```json
  { "success": true, "data": {}, "message": "Created", "timestamp": "ISO8601" }
  ```
  Errors:
  ```json
  { "success": false, "error": "RESOURCE_NOT_FOUND", "message": "User 42 not found", "timestamp": "ISO8601" }
  ```
- **Pagination:** `{ "items": [], "total": 0, "page": 1, "per_page": 20, "pages": 0 }`.
- **HTTP verbs:** Strict REST. No `POST /getUser`.
- **Status codes:** 200, 201, 204, 400, 401, 403, 404, 409, 422, 500.

### Database
- Migrations only. Never `create_all()` or `ddl-auto: create` in production.
- Every FK column gets an index. Every `WHERE` column gets an index.
- Soft deletes: `is_deleted + deleted_at` on all primary entities.
- Every table has `created_at` and `updated_at` (auto-managed).
- snake_case table/column names. Plural table names.

### Auth (JWT)
- Two tokens: `access_token` (15 min) + `refresh_token` (7 days, stored in DB).
- Refresh token rotation: invalidate old on each refresh.
- bcrypt cost factor 12 minimum.
- Logout invalidates refresh token in DB/Redis.

### AI Cost Controls (always implement when AI is enabled)
- `max_tokens` cap on every AI call — never leave unlimited.
- Per-user rate limiting via Redis: track call count per user per hour.
- Token usage logged to DB (`tokens_used` field on chat_messages).
- Never send more than `12000` tokens of document context in a single call — truncate with warning.
- Wrap every AI call in try/except — graceful degradation, never crash the API on AI provider outage.

### Docker
- Multi-stage Dockerfiles for smaller prod images.
- `docker-compose.yml`: app, postgres, redis. Optional: celery worker, nginx.
- Health checks on all services.
- `.env.example` committed (no real secrets ever in git).
- Named volumes for PostgreSQL.

### Error Handling
- FastAPI: Custom exception classes + `@app.exception_handler`.
- Spring Boot: `@ControllerAdvice` for all exception types.
- Log full stack trace on unhandled exceptions. Return generic 500 with request ID to client.
- Never expose internal error details or stack traces to API consumers.

---

## Environment Variables Template

```env
# App
APP_NAME=ProjectName
APP_ENV=development
APP_SECRET_KEY=         # openssl rand -hex 32
DEBUG=true

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/dbname
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET_KEY=         # separate from APP_SECRET_KEY
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
JWT_ALGORITHM=HS256

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# AI Provider (only fill what you use)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=

# AI Config
AI_MODEL=gpt-4o                  # or claude-3-5-sonnet-20241022 etc.
AI_MAX_TOKENS=1000
AI_TEMPERATURE=0.7
AI_RATE_LIMIT_PER_HOUR=50        # per user

# Optional
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

---

## Build Sequence (11 steps — executed one at a time per PHASE 2 rules)

```
Step 1  → Project scaffold + Dockerfile + Docker Compose + .env.example

Step 2  → Database models (all entities) + Base class + first Alembic migration

Step 3  → Repository layer — DB access only, no business logic
          ★ GENERATE CONTEXT.md CHECKPOINT after this step

Step 4  → Service layer — business logic only, calls repositories

Step 5  → Auth flow — register, login, JWT issue, refresh, logout endpoints

Step 6  → Domain CRUD routers/controllers for all entities
          ★ GENERATE CONTEXT.md CHECKPOINT after this step
          ⚠️  TRIGGER CONTEXT LENGTH WARNING if not already shown

Step 7  → AI service layer + all AI endpoints        [if AI selected]

Step 8  → Background tasks (Celery workers)          [if selected]

Step 9  → Frontend connection / static file serving  [if not pure API]
          ★ GENERATE CONTEXT.md CHECKPOINT after this step

Step 10 → Test scaffold — one test file per router, conftest.py

Step 11 → README.md — setup instructions, env vars table, full API endpoint list
```

**Between every step:** announce → build → print completion block → wait for "next".
**Every 3 steps:** generate CONTEXT.md and tell user to save it.
**Never skip layers. Never combine steps. Never auto-continue.**

---

**Execution Directive:** "Do not build a tutorial CRUD app. Build a system you would not be embarrassed to show in a job interview. Every layer has a single job. No business logic in controllers. No DB calls in services. No AI calls without error handling and cost controls. Build one step at a time. Generate context checkpoints. Never lose state."
