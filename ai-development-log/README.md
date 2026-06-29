# 🤖 AI-Assisted Development Log

## Tool Used
**Claude AI** (Anthropic) — Claude Sonnet 4.6 / Claude Opus 4.6  
Platform: claude.ai and Gemini Code Assist (Antigravity agent)

## How Claude AI Contributed to ClearHire

Claude was used as a **coding agent** throughout the entire development lifecycle of ClearHire. Below is a detailed breakdown of each contribution area:

### 1. Architecture Design
- Designed the complete system architecture: React frontend → Node.js backend → MongoDB → UiPath BPMN
- Specified the 3-path BPMN routing logic (auto-shortlist, HR review, auto-reject)
- Designed the parallel gateway pattern for simultaneous notification + interview scheduling
- Designed the 24-hour timer escalation flow for unreviewed candidates

### 2. AI Prompt Engineering
- Wrote the CV extraction prompt (structured data extraction from raw text)
- Wrote the candidate scoring prompt with weighted criteria (skills 40%, experience 25%, education 15%, trajectory 20%)
- Designed the JSON output schema for consistent downstream processing
- Implemented mock fallback responses for quota-limited API scenarios

### 3. MongoDB Schema Design
- Designed the `Candidate` model with embedded score objects, extracted data, and status history arrays
- Designed the `Job` model with structured requirements (skills array, min experience, budget)
- Implemented audit logging via `statusHistory` subdocuments with timestamps

### 4. API Contract Design
- Specified 3 UiPath-facing API endpoints: `/score-candidate`, `/update-status`, `/notify-candidate`
- Designed input/output contracts matching UiPath API Workflow argument types
- Implemented template mapping between UiPath's uppercase constants and internal template names

### 5. WhatsApp Template Design
- Wrote 7 professional message templates covering the entire candidate journey:
  - Application Received, Shortlisted, Under Review, Interview Invite, Rejected, Selected, Offer Letter
- Each template uses WhatsApp formatting (bold, emoji) for professional appearance

### 6. BPMN Flow Specification
- Wrote complete element-by-element BPMN specification for UiPath Maestro
- Specified every gateway condition, variable mapping, and swimlane assignment
- Designed the timer boundary event for 24-hour SLA escalation
- Specified Action Center task form fields for HR review

### 7. Frontend Dashboard
- Designed and implemented the complete React/Vite HR dashboard
- Built premium dark-mode design system with CSS custom properties
- Implemented real-time candidate tracking with score visualization
- Built drag-and-drop CV upload interface

## Evidence
- See [`prompt-logs/architecture-session.md`](prompt-logs/architecture-session.md) for key prompt exchanges
- See [`../external-agent/geminiScorer.js`](../external-agent/geminiScorer.js) for AI prompt implementation
- See [`../external-agent/routes/uipath.js`](../external-agent/routes/uipath.js) for API contract implementation

## Statement of Integration
All AI-generated output has been **meaningfully integrated** into the final solution. Claude did not merely provide advice — it wrote production code that runs in the deployed application, designed the BPMN flow that orchestrates the recruitment pipeline, and engineered the AI prompts that score candidates.
