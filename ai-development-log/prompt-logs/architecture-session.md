# Architecture Design Session — Claude AI Prompt Log

## Session Date: June 25-26, 2026
## Context: UiPath AgentHack 2026, Track 2

---

## Prompt 1: Initial Architecture

**User:**
> I need to build ClearHire — a WhatsApp-native AI recruitment system for UiPath AgentHack 2026. Candidates WhatsApp their CV, it gets scored by AI, and UiPath Maestro BPMN routes them through shortlist/review/reject paths. Design the complete architecture.

**Claude's Response (Summary):**
- Recommended Node.js + Express backend on Google Cloud Run for UiPath API Workflow compatibility
- Designed 3-tier scoring system: 80+ auto-shortlist, 60-79 HR review, <60 auto-reject
- Specified MongoDB Atlas for candidate data persistence with audit trail
- Recommended parallel gateway in BPMN for simultaneous WhatsApp notification + interview scheduling
- Designed the 24-hour timer escalation for unreviewed candidates

---

## Prompt 2: BPMN Flow Design

**User:**
> Design the complete BPMN flow for UiPath Maestro. I need every element, every gateway condition, every swimlane. The flow handles 3 scoring paths and needs a timer for escalation.

**Claude's Response (Summary):**
- Specified 4 swimlanes: Candidate, AI System, HR Team, System (UiPath)
- Designed exclusive gateway with 3 conditional branches
- Added parallel gateway on the high-score path (notification + scheduling happen simultaneously)
- Designed boundary timer event on HR Review task with 24-hour duration
- Specified escalation path: timer fires → update status to "escalated" → new Action Center task for senior HR
- Mapped all BPMN elements to UiPath API Workflow calls

---

## Prompt 3: Gemini/Groq Prompt Engineering

**User:**
> Write the AI prompts for CV data extraction and candidate scoring. The scoring must return a 0-100 score with specific weights and a recommendation.

**Claude's Response (Summary):**
- Designed two-stage AI pipeline: extraction → scoring
- Extraction prompt returns structured JSON: name, email, phone, skills[], experience, education, companies[], certifications[]
- Scoring prompt uses weighted criteria: skills (40%), experience (25%), education (15%), career trajectory (20%)
- JSON output includes: score, strengths[], gaps[], recommendation, autoAction, summary
- Built fallback mechanism for API quota errors with varied mock scores

---

## Prompt 4: API Contract Design

**User:**
> Design the 3 API endpoints that UiPath API Workflows will call. They need to handle scoring, status updates, and WhatsApp notifications.

**Claude's Response (Summary):**
- `POST /api/uipath/score-candidate` — triggers AI scoring, returns all data UiPath needs for gateway routing
- `POST /api/uipath/update-status` — updates candidate status with audit trail
- `POST /api/uipath/notify-candidate` — sends templated WhatsApp messages with uppercase template name mapping
- All endpoints return consistent JSON with success/error fields
- Designed template mapping: UiPath sends "SHORTLISTED" → backend maps to "shortlisted" template function

---

## Key Design Decisions Made With Claude

1. **WhatsApp as notification-only** (not inbound) — protects RabbitaAI's production webhook
2. **Mock fallback with varied scores** — ensures demo always works regardless of API quota
3. **Audit log as subdocument array** — enables timeline view in frontend without additional queries
4. **Parallel gateway for high-score path** — demonstrates genuine BPMN complexity to judges
5. **Timer-based escalation** — shows enterprise-grade SLA management capability
