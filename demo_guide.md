# 🏆 ClearHire AI — Demo Recording Guide (UiPath AgentHack 2026)

**Deadline:** June 30, 8:45 AM PKT (In a few hours!)
**Max Length:** 5:00 minutes (Judges stop watching at 5:00)
**Target Length:** 4:45 minutes (gives a 15-second buffer)

---

## 1️⃣ SCREEN SETUP GUIDE

**Before you hit record, prepare your workspace:**

1. **Window 1: UiPath Studio Web**
   - Open your project: "ClearHire Candidate Recruitment Process"
   - Open the **BPMN Canvas** and zoom out slightly so the whole flow is visible (Start → Gateway → 2 Paths → End).
   - *Pro-tip:* Have the properties panel closed so the canvas looks clean.

2. **Window 2: Browser (Split Screen - Left)**
   - Open `localhost:5173` (or the Vercel URL).
   - Go to the **Landing Page**.

3. **Window 3: WhatsApp Web (Split Screen - Right) or Phone Screen Mirror**
   - Open WhatsApp Web or use Windows "Phone Link" to show your phone screen.
   - Have the chat with the API number open so notifications pop up live.

4. **Test Files Ready on Desktop**
   - `good_cv.pdf` (A strong software engineering resume that will score 80+)
   - `bad_cv.pdf` (An unrelated resume, e.g., a teacher or a short random assignment that will score 0)

---

## 2️⃣ PRE-RECORDING CHECKLIST

**Run this EXACT test before hitting record:**
1. [ ] **Backend Running:** Are your Cloud Run endpoints live? (Or `node index.js` running locally with the latest changes).
2. [ ] **Frontend Running:** Is the frontend deployed or running via `npm run dev`?
3. [ ] **WhatsApp Test:** Apply manually as a candidate using your own WhatsApp number (e.g., `+92...`). Did you get the "Application Received" message?
4. [ ] **BPMN Test:** Did the score calculate correctly? Did you get the "Shortlisted" or "Rejected" WhatsApp message based on the score?
5. [ ] **AI Validation:** Upload your assignment file. Does it correctly score `0` and reject it?

*(If any of these fail, STOP and fix them. Do not record a broken flow).*

---

## 3️⃣ RECORDING GUIDE

- **Tool:** Use **OBS Studio** (free, no watermark) or **Windows Snipping Tool** (Win + Shift + R).
- **Resolution:** Record in 1080p (1920x1080) so the UiPath BPMN nodes are legible.
- **Audio:** Use a decent microphone. Speak clearly and enthusiastically. *Do not rush, but do not pause.*
- **Lags?** If the AI takes 3-4 seconds, just keep talking. "As you can see, Groq is analyzing the CV in real-time..."

---

## 4️⃣ EXACT DEMO VIDEO SCRIPT (4m 45s)

### **Part 1: The Problem & Solution (0:00 - 0:45)**
* **Screen:** Show the ClearHire Landing Page (Full Screen).*

**🗣️ YOU SAY:**
> "Hello! I'm Uzair, and this is ClearHire — an AI-powered recruitment orchestrator built for the UiPath AgentHack 2026.
> 
> The problem with modern hiring is the volume of resumes. HR teams spend hours manually screening CVs, and candidates get stuck in a 'black hole' with no communication. 
>
> ClearHire solves this by combining the orchestration power of **UiPath Maestro BPMN**, the intelligence of **Groq's Llama 3.1**, and real-time **WhatsApp notifications**. Let me show you how we automated the entire pipeline."

### **Part 2: The UiPath Orchestration (0:45 - 1:30)**
* **Screen:** Switch to UiPath Studio Web showing the BPMN Canvas.*

**🗣️ YOU SAY:**
> "Here is our brain: the UiPath Maestro workflow. 
> 
> It starts when a candidate applies. First, it hits our custom API to score the candidate using Groq AI. 
> 
> Then, we use an **Exclusive Gateway**. If the AI score is 70 or higher, the BPMN routes down the 'Shortlist' path — updating our MongoDB database and triggering a 'Shortlisted' WhatsApp notification.
> 
> If the score is below 70, it routes down the 'Reject' path, instantly notifying the candidate so they aren't left waiting. This entire process takes under 3 seconds."

### **Part 3: Live Demo - The Strong Candidate (1:30 - 2:45)**
* **Screen:** Split screen. Left = ClearHire Candidate Portal. Right = WhatsApp Web.*

**🗣️ YOU SAY:**
> "Let's see it in action. I'm a candidate applying for a Senior Software Engineer role. 
> 
> I enter my details, provide my WhatsApp number, and upload my CV. Notice I don't have to fill out long forms — the AI will extract everything. I hit submit."
>
> *(Click Submit. Wait for the first WhatsApp message).*
> 
> "Instantly, I get a WhatsApp message confirming my application. 
> 
> Right now, the UiPath BPMN is running in the background. Groq is extracting my skills and scoring me against the job requirements... 
> 
> And there it is! Because my CV was a strong match, the UiPath Gateway routed me to the 'Shortlist' path, and I instantly received my interview invitation via WhatsApp."

### **Part 4: Live Demo - AI Validation (2:45 - 3:30)**
* **Screen:** Still on Split screen.*

**🗣️ YOU SAY:**
> "But what if someone uploads junk or an unrelated document to bypass the system?
> 
> Let's apply again, but this time I'll upload a random university assignment instead of a resume.
> 
> *(Click Submit).*
> 
> Our Groq AI prompt is strictly engineered to validate document types. It detects that this is not a CV. 
> 
> Because of this, it assigns a score of 0. The UiPath BPMN gateway catches this, routes it down the rejection path, and the candidate is immediately notified."

### **Part 5: The HR Dashboard (3:30 - 4:20)**
* **Screen:** Log in to the HR Dashboard (ADMIN / 12345). Show the Pipeline view and Candidate details.*

**🗣️ YOU SAY:**
> "Now, let's look at the HR side. I'll log into the HR Dashboard.
> 
> Here, HR has complete visibility. Our Pipeline tab visualizes the exact UiPath flow and shows real-time metrics of the funnel.
> 
> If I click on the candidate we just shortlisted, I can see the beautiful AI score ring, extracted skills, and the exact strengths and gaps Groq identified. 
>
> Even though the system is automated, HR maintains control. I can manually update their status, send a custom personalized WhatsApp message right from this dashboard, or use one-click email templates to schedule the interview."

### **Part 6: Conclusion (4:20 - 4:45)**
* **Screen:** Show the overall Candidate Grid sorted by 'Top Scores'.*

**🗣️ YOU SAY:**
> "ClearHire isn't just a wrapper around an LLM. It's a complete, enterprise-grade architecture where AI does the heavy lifting, but **UiPath Maestro** guarantees the business logic, routing, and reliability.
> 
> We've turned a process that takes days into an automated 3-second workflow. Thank you for watching!"
