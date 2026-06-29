const express = require('express');
const router  = express.Router();
const { Candidate, Job } = require('../mongoClient');
const { notify } = require('../whatsappNotifier');
const { scoreCandidate, extractCVData } = require('../geminiScorer');

/**
 * POST /api/uipath/score-candidate  (also /api/uipath/score)
 * UiPath BPMN calls this to trigger AI scoring.
 * Body: { candidateId, jobId? }
 * Returns: { candidateId, score, recommendation, autoAction, strengths, gaps,
 *            whatsappNumber, candidateName, jobTitle, summary }
 */
async function handleScore(req, res) {
  try {
    const { candidateId, jobId } = req.body;
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    const job = await Job.findById(jobId || candidate.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    // Re-extract if needed
    let extracted = candidate.extracted;
    if (!extracted?.skills?.length && candidate.cvText) {
      extracted = await extractCVData(candidate.cvText);
      candidate.extracted = extracted;
      candidate.name  = extracted.name  || candidate.name;
      candidate.email = extracted.email || candidate.email;
      candidate.phone = extracted.phone || candidate.phone;
    }

    const result = await scoreCandidate(candidate.cvText, extracted || {}, job);
    candidate.score = {
      overall: result.score,
      strengths: result.strengths,
      gaps: result.gaps,
      recommendation: result.recommendation,
      summary: result.summary
    };
    candidate.status = 'scored';
    candidate.statusHistory.push({ status: 'scored', note: 'AI scoring complete via UiPath' });
    await candidate.save();

    console.log(`🧠 Scored: ${candidate.name} → ${result.score}/100 (${result.recommendation})`);

    res.json({
      candidateId: candidate._id,
      score: result.score,
      recommendation: result.recommendation,
      autoAction: result.autoAction || result.recommendation,
      strengths: Array.isArray(result.strengths) ? result.strengths.join('; ') : '',
      gaps: Array.isArray(result.gaps) ? result.gaps.join('; ') : '',
      whatsappNumber: candidate.whatsappNumber || candidate.phone || '',
      candidateName: candidate.name || 'Unknown',
      jobTitle: job.title,
      summary: result.summary || ''
    });
  } catch (err) {
    console.error('UiPath score error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

router.post('/score', handleScore);
router.post('/score-candidate', handleScore);

/**
 * POST /api/uipath/update-status
 * UiPath BPMN calls this after a gateway decision or Action Center task.
 * Body: { candidateId, status, note, by?, interviewDate?, hrNotes? }
 * Status options: "shortlisted" | "rejected" | "interview_scheduled" |
 *                 "under_review" | "escalated" | "selected"
 * Returns: { success, candidateId, status }
 */
router.post('/update-status', async (req, res) => {
  try {
    const { candidateId, status, note, by } = req.body;
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    candidate.status = status;
    candidate.statusHistory.push({
      status,
      note: note || '',
      by: by || 'uipath',
      timestamp: new Date()
    });

    if (req.body.interviewDate) {
      candidate.interviewDate = new Date(req.body.interviewDate);
    }
    if (req.body.hrNotes) {
      candidate.hrNotes = req.body.hrNotes;
    }

    await candidate.save();
    console.log(`🔄 Status updated: ${candidate.name} → ${status}`);
    res.json({ success: true, candidateId, status });
  } catch (err) {
    console.error('UiPath update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/uipath/notify-candidate  (also /api/uipath/notify)
 * UiPath BPMN calls this to send a WhatsApp notification.
 * Body: { candidateId, templateName (or template), date? }
 * templateName: "applicationReceived"|"shortlisted"|"rejected"|"interviewInvite"|
 *               "underReview"|"selected"|"offerLetter"|"RECEIVED"|"SHORTLISTED"|
 *               "REJECTED"|"INTERVIEW_INVITE"|"UNDER_REVIEW"|"ESCALATED"|"OFFER"
 * Returns: { success, messageSent, messageId? }
 */
const TEMPLATE_MAP = {
  'RECEIVED':         'applicationReceived',
  'SHORTLISTED':      'shortlisted',
  'REJECTED':         'rejected',
  'INTERVIEW_INVITE': 'interviewInvite',
  'UNDER_REVIEW':     'underReview',
  'ESCALATED':        'underReview',
  'OFFER':            'offerLetter',
  'SELECTED':         'selected',
};

async function handleNotify(req, res) {
  try {
    const { candidateId, date } = req.body;
    const rawTemplate = req.body.templateName || req.body.template;
    const template = TEMPLATE_MAP[rawTemplate] || rawTemplate || 'applicationReceived';

    const candidate = await Candidate.findById(candidateId).populate('jobId', 'title');
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    const phone = candidate.whatsappNumber || candidate.phone;
    if (!phone) return res.status(400).json({ error: 'No phone number for candidate' });

    const result = await notify(template, phone, {
      name: candidate.name || 'Candidate',
      jobTitle: candidate.jobId?.title || 'the position',
      date: date || candidate.interviewDate?.toLocaleDateString()
    });

    console.log(`📱 Notified: ${candidate.name} via template "${template}"`);
    res.json({ success: true, messageSent: !!result?.success, ...result });
  } catch (err) {
    console.error('UiPath notify error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

router.post('/notify', handleNotify);
router.post('/notify-candidate', handleNotify);

/**
 * GET /api/uipath/candidate/:id
 * UiPath reads candidate data at various BPMN stages.
 */
router.get('/candidate/:id', async (req, res) => {
  try {
    const c = await Candidate.findById(req.params.id).populate('jobId');
    if (!c) return res.status(404).json({ error: 'Candidate not found' });
    res.json({
      candidateId: c._id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      whatsappNumber: c.whatsappNumber,
      score: c.score?.overall || 0,
      recommendation: c.score?.recommendation || 'pending',
      autoAction: c.score?.recommendation || 'pending',
      strengths: c.score?.strengths || [],
      gaps: c.score?.gaps || [],
      scoreSummary: c.score?.summary || '',
      status: c.status,
      jobTitle: c.jobId?.title,
      extracted: c.extracted,
      statusHistory: c.statusHistory
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
