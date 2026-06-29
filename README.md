# 🎯 ClearHire — AI-Powered Recruitment Orchestration

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933.svg)](https://nodejs.org)
[![UiPath](https://img.shields.io/badge/UiPath-Maestro%20BPMN-orange.svg)](https://www.uipath.com)
[![Google Cloud Run](https://img.shields.io/badge/Google%20Cloud-Run-4285F4.svg)](https://cloud.google.com/run)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248.svg)](https://www.mongodb.com/atlas)

> **Intelligent WhatsApp-native hiring pipeline that automates CV screening, AI scoring, and candidate routing — orchestrated by UiPath Maestro BPMN.**

---

## 🔥 What It Does

ClearHire transforms the traditional hiring process — which takes an average of **36 days per hire** — into an automated, AI-driven pipeline that screens and routes candidates in under **30 seconds**.

HR managers create job postings on the ClearHire dashboard. Candidates submit their CVs through a web portal (with WhatsApp integration for notifications). The system automatically:

1. **Extracts** structured data from CVs using AI (skills, experience, education)
2. **Scores** each candidate 0–100 against job requirements using **Groq Llama 3.1 70B** (sub-2-second inference)
3. **Routes** candidates through a **UiPath Maestro BPMN** workflow with an intelligent Exclusive Gateway
4. **Updates** MongoDB in real time with the candidate's new status and full audit history
5. **Notifies** candidates via WhatsApp at every stage of the process

The result: zero manual screening for the majority of applications, human review only where it matters, and candidates who never wonder "did they even read my resume?"

---

## 💼 The Business Problem

| Metric | Traditional | ClearHire |
|--------|------------|-----------|
| Time to screen one CV | 7.4 minutes | < 5 seconds |
| Days to first response | 8–14 days | Instant |
| HR hours per 100 applicants | 12+ hours | 1.5 hours |
| Candidate ghosting rate | 52% | ~0% (WhatsApp updates) |

*Sources: SHRM 2024, LinkedIn Talent Solutions, Glassdoor Hiring Survey*

Recruiters spend **80% of their time on candidates they'll reject**. ClearHire flips this: AI handles the obvious decisions, and humans focus exclusively on borderline candidates where judgment matters.

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   React/Vite    │────▶│   Node.js/Express     │────▶│  MongoDB Atlas  │
│   HR Dashboard  │◀────│   (Google Cloud Run)  │◀────│  (clearhire DB) │
└─────────────────┘     └──────────┬────────────┘     └─────────────────┘
                                   │
                      ┌────────────┼────────────┐
                      ▼            ▼            ▼
               ┌───────────┐ ┌──────────┐ ┌─────────────────┐
               │  Groq AI  │ │ WhatsApp │ │  UiPath Maestro │
               │ Llama 3.1 │ │ Cloud API│ │  BPMN Process   │
               │   70B     │ │  (Meta)  │ │  + API Workflows│
               └───────────┘ └──────────┘ └─────────────────┘
```

### Maestro BPMN Decision Flow

```
Start → ScoreCandidate_API (Groq AI scores CV 0-100)
              │
      [Exclusive Gateway: Out_Score >= 70?]
         │                      │
        YES                     NO
         │                      │
  UpdateStatus_API         UpdateStatus_API
  (status: shortlisted)    (status: rejected)
         │                      │
  NotifyCandidate_API      NotifyCandidate_API
  (template: SHORTLISTED)  (template: REJECTED)
         │                      │
         └──────────┬───────────┘
                   End
```

---

## 🤖 UiPath Components Used

| Component | Specific Usage |
|-----------|---------------|
| **Maestro BPMN** | Orchestrates the entire recruitment flow with an Exclusive Gateway that branches on `Out_Score >= 70`. Built in UiPath Studio Web. |
| **API Workflows (3)** | `ScoreCandidate_API`, `UpdateStatus_API`, `NotifyCandidate_API` — each a published HTTP workflow calling our Cloud Run backend |
| **Integration Service** | HTTP Request activities configured with `Content-Type: application/json` to call our REST API |
| **Orchestrator** | All 3 API workflows published and managed as automation packages |

**Agent Type:** Coded external agent (Node.js on Google Cloud Run) + UiPath API Workflow orchestration

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js 18 + Express |
| AI Scoring | Groq SDK — Llama 3.1 70B Versatile |
| Database | MongoDB Atlas |
| Notifications | Meta WhatsApp Cloud API |
| Frontend | React 18 + Vite |
| Backend Hosting | Google Cloud Run |
| Orchestration | UiPath Maestro BPMN + API Workflows |

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- Google Cloud CLI (`gcloud`)
- Firebase CLI (`firebase-tools`)
- MongoDB Atlas account (free tier works)
- Groq API key (free at [console.groq.com](https://console.groq.com))
- Meta Developer account (WhatsApp Cloud API)
- UiPath Automation Cloud access

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/clearhire-ai.git
cd clearhire-ai/external-agent
cp .env.example .env
# Fill in your credentials in .env
npm install
```

### 2. Configure Environment

Edit `external-agent/.env`:

```env
MONGODB_URI=mongodb+srv://...          # MongoDB Atlas connection string
GROQ_API_KEY=gsk_...                   # From console.groq.com
WA_TOKEN=EAA...                        # Meta WhatsApp Bearer token
WA_PHONE_NUMBER_ID=1234567890          # WhatsApp phone number ID
PORT=8080
```

### 3. Run Locally

```bash
# Terminal 1 — Backend
cd external-agent && node index.js
# → Running on http://localhost:8080

# Terminal 2 — Frontend
cd frontend && npm run dev
# → Dashboard on http://localhost:5173
```

### 4. Deploy Backend to Google Cloud Run

```bash
cd external-agent
gcloud run deploy clearhire-agent \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

### 5. Configure UiPath Maestro

See [`uipath-workflows/api-contracts.md`](uipath-workflows/api-contracts.md) for full API Workflow setup.

**The 3 published API Workflows call these endpoints:**

| Workflow | Method | Endpoint |
|----------|--------|----------|
| `ScoreCandidate_API` | POST | `/api/uipath/score-candidate` |
| `UpdateStatus_API` | POST | `/api/uipath/update-status` |
| `NotifyCandidate_API` | POST | `/api/uipath/notify-candidate` |

---

## 📡 API Reference

### POST `/api/uipath/score-candidate`
```json
// Request
{ "candidateId": "mongo_object_id", "jobId": "mongo_object_id" }

// Response
{
  "score": 91,
  "recommendation": "shortlist",
  "autoAction": "shortlist",
  "candidateName": "Ahmed Khan",
  "jobTitle": "Node.js Developer",
  "strengths": "Strong backend skills; MongoDB expertise",
  "gaps": "No cloud experience",
  "summary": "Candidate scored 91/100. Strong match — auto-shortlisted."
}
```

### POST `/api/uipath/update-status`
```json
// Request
{ "candidateId": "...", "status": "shortlisted", "note": "AI auto-shortlisted" }

// Response
{ "success": true, "candidateId": "...", "status": "shortlisted" }
```

### POST `/api/uipath/notify-candidate`
```json
// Request
{ "candidateId": "...", "templateName": "SHORTLISTED" }

// Response
{ "success": true, "messageSent": true }
```

---

## 🤖 AI-Assisted Development

This project was developed with the assistance of **Antigravity (Google DeepMind)** and **Claude AI (Anthropic)** as coding and architecture agents.

**How AI contributed:**
- 🏗️ Architecture design (BPMN flow, gateway logic, API contracts)
- 🧠 AI prompt engineering (CV extraction + scoring prompts for Groq)
- 📊 MongoDB schema design (Candidate + Job models with full audit history)
- 🔌 UiPath integration (HTTP Request configuration, output variable mapping)
- 💬 WhatsApp template design (7 templates for the candidate journey)
- 🐛 Live debugging of UiPath Studio Web gateway conditions and variable scoping

Evidence: See [`ai-development-log/`](ai-development-log/) for development documentation.

---

## 📹 Demo Video

[YouTube Link — Coming Soon]

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

*Built for UiPath AgentHack 2026 — Track 2: UiPath Maestro BPMN*
