# ClearHire — UiPath API Contracts

## Base URL
Replace `{BASE_URL}` with your Cloud Run URL (e.g., `https://clearhire-agent-xxxxx-uc.a.run.app`)

For local testing: `http://localhost:8080`

---

## API Workflow 1: ScoreCandidate_API

**Purpose:** UiPath BPMN calls this to trigger AI scoring of a candidate's CV against the job requirements.

| Field | Value |
|-------|-------|
| HTTP Method | POST |
| URL | `{BASE_URL}/api/uipath/score-candidate` |
| Content-Type | application/json |

### Request Body
```json
{
  "candidateId": "MongoDB ObjectId string",
  "jobId": "MongoDB ObjectId string"
}
```

### UiPath Input Arguments
| Argument Name | Type | Description |
|--------------|------|-------------|
| In_CandidateId | String | The candidate's MongoDB _id |
| In_JobId | String | The job posting's MongoDB _id |

### Response (200 OK)
```json
{
  "candidateId": "6a3d768c60dc7c0f6ecce3aa",
  "score": 85,
  "recommendation": "shortlist",
  "autoAction": "shortlist",
  "strengths": "Strong Node.js experience; Relevant cloud architecture background",
  "gaps": "Slightly under requested years of experience in React",
  "whatsappNumber": "+923001234567",
  "candidateName": "Ahmed Khan",
  "jobTitle": "Node.js Developer",
  "summary": "Candidate shows exceptional backend skills and matches core requirements."
}
```

### UiPath Output Arguments
| Argument Name | Type | Description |
|--------------|------|-------------|
| Out_Score | Int32 | Score 0-100 |
| Out_Recommendation | String | "shortlist" \| "review" \| "reject" |
| Out_AutoAction | String | Same as recommendation |
| Out_WhatsAppNumber | String | Candidate's WhatsApp number |
| Out_CandidateName | String | Candidate's full name |
| Out_Strengths | String | Semicolon-separated strengths |
| Out_Gaps | String | Semicolon-separated gaps |
| Out_JobTitle | String | Job title text |

### Gateway Conditions (use Out_Score)
- **Path A (Auto-Shortlist):** `Out_Score >= 80`
- **Path B (HR Review):** `Out_Score >= 60 AND Out_Score < 80`
- **Path C (Auto-Reject):** `Out_Score < 60`

---

## API Workflow 2: UpdateCandidateStatus_API

**Purpose:** UiPath BPMN calls this after gateway decisions or Action Center task completions to update a candidate's status in MongoDB.

| Field | Value |
|-------|-------|
| HTTP Method | POST |
| URL | `{BASE_URL}/api/uipath/update-status` |
| Content-Type | application/json |

### Request Body
```json
{
  "candidateId": "MongoDB ObjectId string",
  "status": "shortlisted",
  "note": "Auto-shortlisted by BPMN (score >= 80)"
}
```

### Valid Status Values
| Status | When Used |
|--------|-----------|
| `shortlisted` | Score 80+ auto-shortlist, or HR approves review candidate |
| `rejected` | Score <60 auto-reject, or HR rejects review candidate |
| `under_review` | Score 60-79, sent to HR for review |
| `interview_scheduled` | HR schedules interview for shortlisted candidate |
| `escalated` | 24-hour timer fires on unreviewed candidate |
| `selected` | After successful interview |

### UiPath Input Arguments
| Argument Name | Type | Description |
|--------------|------|-------------|
| In_CandidateId | String | The candidate's MongoDB _id |
| In_Status | String | One of the status values above |
| In_Note | String | Human-readable note for audit trail |

### Response (200 OK)
```json
{
  "success": true,
  "candidateId": "6a3d768c60dc7c0f6ecce3aa",
  "status": "shortlisted"
}
```

### UiPath Output Arguments
| Argument Name | Type | Description |
|--------------|------|-------------|
| Out_Success | Boolean | true if update succeeded |

---

## API Workflow 3: NotifyCandidate_API

**Purpose:** UiPath BPMN calls this to send a WhatsApp notification to a candidate at key stages.

| Field | Value |
|-------|-------|
| HTTP Method | POST |
| URL | `{BASE_URL}/api/uipath/notify-candidate` |
| Content-Type | application/json |

### Request Body
```json
{
  "candidateId": "MongoDB ObjectId string",
  "templateName": "SHORTLISTED"
}
```

### Valid Template Names
| Template Name | When Used | Message Preview |
|--------------|-----------|-----------------|
| `RECEIVED` | After CV is scored | "Thank you for applying..." |
| `SHORTLISTED` | Auto-shortlist or HR approval | "Great news! You've been shortlisted..." |
| `UNDER_REVIEW` | Sent to HR review queue | "Your application is under review..." |
| `INTERVIEW_INVITE` | HR schedules interview | "You've been invited to interview..." |
| `REJECTED` | Auto-reject or HR rejection | "After careful review..." |
| `SELECTED` | After successful interview | "Congratulations! You've been selected..." |
| `OFFER` | Offer letter ready | "Your offer letter is ready..." |

### UiPath Input Arguments
| Argument Name | Type | Description |
|--------------|------|-------------|
| In_CandidateId | String | The candidate's MongoDB _id |
| In_TemplateName | String | One of the template names above |

### Response (200 OK)
```json
{
  "success": true,
  "messageSent": true,
  "messageId": "wamid.xxx..."
}
```

### UiPath Output Arguments
| Argument Name | Type | Description |
|--------------|------|-------------|
| Out_Success | Boolean | true if notification attempted |
| Out_MessageSent | Boolean | true if WhatsApp accepted the message |

---

## UiPath Studio Web — Step-by-Step Setup

### Creating an API Workflow

1. Open **UiPath Studio Web** (cloud.uipath.com → Studio Web)
2. Click **"Create New"** → **"API Workflow"**
3. Name it (e.g., `ScoreCandidate_API`)
4. In the workflow canvas, add an **"HTTP Request"** activity
5. Configure:
   - **Method:** POST
   - **URL:** Paste the full endpoint URL
   - **Headers:** Add `Content-Type: application/json`
   - **Body:** Build JSON from input arguments
6. Add **Input Arguments** in the left panel (name, type, direction: In)
7. Add **Output Arguments** (direction: Out)
8. Use **"Deserialize JSON"** activity to parse the HTTP response
9. Map response fields to output arguments using **"Assign"** activities
10. **Save** and **Publish** the workflow

### Connecting API Workflow to BPMN

1. In **Maestro** → open your BPMN process
2. Add a **Service Task** element
3. In its properties, select **"API Workflow"** as the task type
4. Choose the published workflow (e.g., `ScoreCandidate_API`)
5. Map BPMN process variables to the workflow's input/output arguments
6. The BPMN will call the workflow when execution reaches that task

---

## Testing Endpoints (curl)

```bash
# Test Score
curl -X POST {BASE_URL}/api/uipath/score-candidate \
  -H "Content-Type: application/json" \
  -d '{"candidateId": "YOUR_CANDIDATE_ID", "jobId": "YOUR_JOB_ID"}'

# Test Update Status
curl -X POST {BASE_URL}/api/uipath/update-status \
  -H "Content-Type: application/json" \
  -d '{"candidateId": "YOUR_CANDIDATE_ID", "status": "shortlisted", "note": "Test"}'

# Test Notify
curl -X POST {BASE_URL}/api/uipath/notify-candidate \
  -H "Content-Type: application/json" \
  -d '{"candidateId": "YOUR_CANDIDATE_ID", "templateName": "SHORTLISTED"}'

# Health Check
curl {BASE_URL}/health
```
