# AI-First CRM HCP Module (Veeva CRM & Salesforce Health Cloud Grade)

An enterprise-grade, production-ready **AI-First CRM Healthcare Professional (HCP) Module** engineered for Medical Representatives (Sales Reps) to seamlessly log, manage, analyze, and optimize their interactions with doctors using state-of-the-art **LangGraph** multi-agent workflows and **Groq LLM APIs** (`gemma2-9b-it` & `llama-3.3-70b-versatile`).

---

## 🌟 Key Features & Highlights

### 1. Log Interaction Screen (Master Dual-Mode Engine)
- **Mode 1: Structured Form**: Comprehensive form with React Hook Form, Zod validation, multi-select tag pills for pharmaceutical products, sample tracking, sentiment indicator, and one-click AI summary & sentiment analysis.
- **Mode 2: Conversational AI Chat (`ChatGPT` Style)**: Representatives type or speak naturally (via integrated **Speech-to-Text / Voice Input**). For example:
  > *"Visited Dr. Sharma today at Apollo Hospital. Discussed our new diabetes therapy (MetfoPlus) and cardio protectant. Doctor showed high interest and requested 10 sample packs. Follow-up needed next Tuesday on dosage guidelines."*
- **Real-Time LangGraph Workflow & Editable Structured Preview**: As you chat, the **LangGraph Agent** automatically runs through structured nodes (`Intent Detection` ➔ `Entity Extraction` ➔ `Log Interaction Tool` ➔ `LLM Response`). The extracted fields instantly populate a right-side **Editable Structured Preview Card** with real-time confidence scores and duplicate detection checks before saving!

### 2. Five Powerful LangGraph Tools
- **Tool 1: `Log Interaction`**: Summarizes interaction, extracts HCP name, hospital, products discussed, sentiment (`Positive`, `Neutral`, `Negative`), follow-up needs, and stores draft/final records.
- **Tool 2: `Edit Interaction`**: Fetches existing interaction records, intelligently patches modifications via LLM extraction, and saves an immutable **Version History (`interaction_history`)**.
- **Tool 3: `Retrieve HCP Profile`**: Deep-dives into past visits, preferences, prescription trends, and relationship metrics.
- **Tool 4: `Generate Follow-up Plan`**: Synthesizes prior visit history using `llama-3.3-70b-versatile` / `gemma2-9b-it` to construct optimal follow-up strategies, talking points, suggested dates, and priority ratings.
- **Tool 5: `Meeting Insights`**: Analyzes historical interactions across HCPs to compute dynamic **Relationship Scores (0-100)**, **Risk Scores**, and **Opportunity Scores**, surfacing churn alerts and high-value actionable recommendations.

### 3. Comprehensive CRM Suite
- **HCP Directory & 360° Profile**: Filter doctors by specialization, hospital, tier, and sentiment. Explore interactive **Doctor Timelines**, prescription charts, and automated meeting insights.
- **Interactions Audit & Version History**: Table and card layouts with search, filters, **Version History Comparison Modal (Git-like Diff view)**, and professional **Export to PDF** capabilities.
- **AI Assistant Explorer**: Dedicated playground to interrogate the LangGraph agent, inspect step-by-step node execution traces, latency, and agent logs.
- **Analytics Dashboard**: Real-time KPI cards (`Interactions Logged`, `Average Sentiment`, `Opportunity Index`), interaction volume charts, and product distribution breakdown.

---

## 🏗️ System Architecture & Workflow

### LangGraph Execution Flow
```mermaid
graph TD
    A[User Input / Voice Speech] --> B[Intent Detection Node]
    B --> C[Entity Extraction Node NER]
    C --> D[Tool Selector Node]
    D -->|Tool 1| E1[Log Interaction Tool]
    D -->|Tool 2| E2[Edit Interaction Tool]
    D -->|Tool 3| E3[Retrieve HCP Profile Tool]
    D -->|Tool 4| E4[Generate Follow-up Tool]
    D -->|Tool 5| E5[Meeting Insights Tool]
    E1 --> F[LLM Response & Confidence Generator]
    E2 --> F
    E3 --> F
    E4 --> F
    E5 --> F
    F --> G[Database Updater Node / Draft Preview]
    G --> H[Return Response & Trace to Redux UI]
```

### Mandatory Technology Stack
- **Frontend**: React 19, Vite, Redux Toolkit, React Router DOM, TailwindCSS, TypeScript, React Hook Form + Zod, Shadcn UI primitives, Lucide Icons, Framer Motion, Google Inter Font.
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy (Async & Sync ORM), Pydantic v2, PostgreSQL, Alembic.
- **AI & State Machine**: LangGraph (`StateGraph`), LangChain, Groq API (`gemma2-9b-it` primary, `llama-3.3-70b-versatile` secondary).

---

## 📁 Folder Structure

```
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   │   ├── tools/
│   │   │   │   ├── tool_log_interaction.py
│   │   │   │   ├── tool_edit_interaction.py
│   │   │   │   ├── tool_retrieve_profile.py
│   │   │   │   ├── tool_generate_followup.py
│   │   │   │   └── tool_meeting_insights.py
│   │   │   ├── graph.py             # LangGraph StateGraph Definition
│   │   │   └── prompts.py           # Reusable System & Tool Prompts
│   │   ├── api/
│   │   │   └── endpoints/           # REST APIs (/interaction, /hcp, /chat, /followup, /analytics)
│   │   ├── db/
│   │   │   ├── database.py          # SQLAlchemy Async Engine & Sessions
│   │   │   └── seed.py              # Out-of-the-box Realistic Data Seeder
│   │   ├── models/
│   │   │   └── schema.py            # Complete Relational SQL Schema
│   │   ├── schemas/                 # Pydantic v2 Request/Response Schemas
│   │   ├── config.py                # Environment Configuration
│   │   └── main.py                  # FastAPI Application Entry
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/              # Sidebar, Header, MainLayout
│   │   │   └── ui/                  # Shadcn UI Primitives & Commons
│   │   ├── pages/
│   │   │   ├── LogInteraction/      # StructuredForm, ChatMode, EditablePreview, LangGraphVisualizer
│   │   │   ├── Dashboard/           # Executive KPI Cards & Feed
│   │   │   ├── HCPs/                # Directory & 360° Profile View + Timeline
│   │   │   ├── Interactions/        # Table, Version History Diff Modal, PDF Export
│   │   │   ├── Assistant/           # LangGraph Agent Explorer & Logs
│   │   │   ├── Analytics/           # Visual Charts & KPI Dashboard
│   │   │   └── Settings/            # Groq Model Picker & Theme Configuration
│   │   ├── store/
│   │   │   ├── slices/              # Redux Slices (auth, hcp, interaction, chat, agent, analytics)
│   │   │   └── index.ts
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🚀 Quick Start Guide

### Step 1: Environment Variables Setup
Copy `.env.example` to `.env` in the root directory:
```bash
cp .env.example .env
```

Ensure your `.env` contains your **Groq API Key**:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_PRIMARY_MODEL=gemma2-9b-it
GROQ_SECONDARY_MODEL=llama-3.3-70b-versatile
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crm_hcp_db
```

### Step 2: Running with Docker Compose (Recommended)
You can start PostgreSQL, FastAPI Backend, and React Frontend instantly:
```bash
docker-compose up --build
```
- **Frontend Dashboard**: `http://localhost:5173`
- **Backend API & Swagger Docs**: `http://localhost:8000/docs`

### Step 3: Manual Local Development Setup

#### 1. Start PostgreSQL
Ensure PostgreSQL is running locally and create database `crm_hcp_db` (or use the provided Docker compose service for DB):
```bash
docker-compose up -d postgres
```

#### 2. Run Python FastAPI Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate   # On Windows (or source venv/bin/activate on Linux/Mac)
pip install -r requirements.txt

# Seed realistic initial data (Doctors, Hospitals, Products, Interactions, Analytics)
python -m app.db.seed

# Start FastAPI development server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 3. Run React 19 + Vite Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📸 Screenshots Placeholders

| **Dashboard & Key Metrics** | **Conversational AI Chat Mode** |
| :---: | :---: |
| `![Dashboard Preview](/screenshots/dashboard.png)` | `![Chat Mode & Editable Preview](/screenshots/chat_mode.png)` |

| **Structured Interaction Form** | **HCP 360° Profile & Timeline** |
| :---: | :---: |
| `![Structured Form](/screenshots/structured_form.png)` | `![HCP Profile View](/screenshots/hcp_profile.png)` |

| **LangGraph Visual Trace & Logs** | **Interaction Version History Diff** |
| :---: | :---: |
| `![LangGraph Visualizer](/screenshots/langgraph_trace.png)` | `![Version History Diff](/screenshots/version_diff.png)` |

---

## 🤖 Groq API & LangGraph Configuration
The application uses Groq's high-speed inference engine:
- **Primary Model (`gemma2-9b-it`)**: Ultra-fast latency for real-time Entity Extraction (NER), Sentiment classification, and live chat extraction.
- **Secondary Model (`llama-3.3-70b-versatile`)**: Deep strategic reasoning for generating multi-visit Follow-up Plans, Opportunity/Risk scoring (`Meeting Insights`), and relationship trajectory analysis.

If you don't have a Groq API key yet, get a free one at [https://console.groq.com](https://console.groq.com). Even without an active key, our LangGraph agent includes a robust **Intelligent Fallback Engine** that simulates precise entity extraction and insights so the demo runs smoothly out-of-the-box!
