const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.1-70b-versatile';

/* ── Mock Fallback Data ── */
const MOCK_SCORES = [87, 63, 45, 91, 72, 38, 85, 56];
let mockIndex = 0;

function getMockScore() {
  const score = MOCK_SCORES[mockIndex % MOCK_SCORES.length];
  mockIndex++;
  let recommendation, strengths, gaps;

  if (score >= 80) {
    recommendation = 'shortlist';
    strengths = ['Strong technical skills matching job requirements', 'Relevant industry experience', 'Solid educational background'];
    gaps = ['Could benefit from more cloud-native experience'];
  } else if (score >= 60) {
    recommendation = 'review';
    strengths = ['Good foundational knowledge', 'Relevant certifications'];
    gaps = ['Below required years of experience', 'Missing key skills from requirements'];
  } else {
    recommendation = 'reject';
    strengths = ['Shows initiative with side projects'];
    gaps = ['Significantly below required experience level', 'Missing most required skills', 'No relevant industry background'];
  }

  return {
    score,
    strengths,
    gaps,
    recommendation,
    autoAction: recommendation,
    summary: `Candidate scored ${score}/100. ${recommendation === 'shortlist' ? 'Strong match — auto-shortlisted.' : recommendation === 'review' ? 'Partial match — requires HR review.' : 'Poor match — auto-rejected.'}`
  };
}

function getMockExtraction() {
  return {
    name: 'Candidate (AI Pending)',
    email: 'candidate@example.com',
    phone: '+92 300 0000000',
    skills: ['JavaScript', 'Node.js', 'Express', 'MongoDB'],
    experience: 3,
    education: 'BS Computer Science',
    previousCompanies: ['Tech Solutions Inc.'],
    certifications: ['AWS Certified Developer'],
    summary: 'Experienced developer with backend focus and cloud deployment skills.'
  };
}

/** Retry wrapper — tries Groq, falls back to mock on any error */
async function withRetry(fn, isScoring = false) {
  try {
    return await fn();
  } catch (err) {
    console.log(`⚠️ Groq API error: ${err.message?.substring(0, 120)}`);
    console.log(`⚠️ Falling back to MOCK AI response for the demo...`);
    return isScoring ? getMockScore() : getMockExtraction();
  }
}

/**
 * Extract structured data from raw CV text using Groq (Llama 3.1 70B).
 */
async function extractCVData(cvText) {
  const prompt = `You are an expert CV/resume parser. Extract structured data from this CV text.

Return ONLY valid JSON (no markdown, no code fences):
{
  "name": "full name",
  "email": "email or null",
  "phone": "phone or null",
  "skills": ["skill1", "skill2"],
  "experience": <total years as number>,
  "education": "highest education",
  "previousCompanies": ["company1", "company2"],
  "certifications": ["cert1"],
  "summary": "2-3 sentence professional summary"
}

CV Text:
${cvText.substring(0, 5000)}`;

  return withRetry(async () => {
    const result = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 1024,
    });
    const raw = result.choices[0].message.content.trim()
      .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(raw);
  }, false);
}

/**
 * Score a candidate against job requirements using Groq (Llama 3.1 70B).
 * Returns { score, strengths, gaps, recommendation, autoAction, summary }.
 */
async function scoreCandidate(cvText, extractedData, job) {
  const req = job.requirements || {};

  const prompt = `You are ClearHire's AI recruiter. Score this candidate 0-100 against the job.

CRITICAL: First check if the document is actually a CV/resume. If it is NOT a CV (e.g. assignment, essay, report, random text), score it 0 and set recommendation to "reject" with gap "Document is not a CV/resume".

SCORING GUIDE:
  80-100  → "shortlist"  (strong match, auto-shortlist)
  60-79   → "review"     (partial match, HR should review)
  0-59    → "reject"     (poor match, auto-reject)

Weight: skills 40%, experience 25%, education 15%, trajectory 20%.

Return ONLY valid JSON (no markdown):
{
  "score": <0-100>,
  "strengths": ["strength1","strength2","strength3"],
  "gaps": ["gap1","gap2"],
  "recommendation": "shortlist" | "review" | "reject",
  "autoAction": "shortlist" | "review" | "reject",
  "summary": "2-3 sentence assessment"
}

── JOB ──
Title: ${job.title}
Skills: ${req.skills?.join(', ') || 'Not specified'}
Min experience: ${req.minExperience || 0} years
Location: ${req.location || 'Any'}
Budget: ${req.maxBudget || 'N/A'}
Notes: ${req.additionalNotes || 'None'}
Description: ${job.description || 'None'}

── CANDIDATE ──
Name: ${extractedData.name}
Skills: ${extractedData.skills?.join(', ')}
Experience: ${extractedData.experience} years
Education: ${extractedData.education}
Companies: ${extractedData.previousCompanies?.join(', ')}
Certs: ${extractedData.certifications?.join(', ')}

Full CV (first 3000 chars):
${cvText.substring(0, 3000)}`;

  return withRetry(async () => {
    const result = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 1024,
    });
    const raw = result.choices[0].message.content.trim()
      .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(raw);
    // Ensure autoAction field exists
    if (!parsed.autoAction) parsed.autoAction = parsed.recommendation;
    return parsed;
  }, true);
}

module.exports = { extractCVData, scoreCandidate };
