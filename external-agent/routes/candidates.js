const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { Candidate, Job } = require('../mongoClient');
const { extractTextFromFile } = require('../cvParser');
const { extractCVData, scoreCandidate } = require('../geminiScorer');
const { notify } = require('../whatsappNotifier');

// Multer setup — store CVs in /uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10 MB

/**
 * POST /api/candidates/apply
 * Body (multipart): cv (file), jobId, whatsappNumber
 * This is the main entry point — CV upload → parse → score → route.
 */
router.post('/apply', upload.single('cv'), async (req, res) => {
  try {
    const { jobId, whatsappNumber } = req.body;
    if (!jobId)    return res.status(400).json({ error: 'jobId is required' });
    if (!req.file) return res.status(400).json({ error: 'CV file is required' });

    // 1. Verify job exists
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    // 2. Create candidate record immediately
    const candidate = await Candidate.create({
      jobId,
      whatsappNumber: whatsappNumber || null,
      cvFileName: req.file.originalname,
      status: 'parsing',
      statusHistory: [{ status: 'received', note: 'CV uploaded via portal' }]
    });

    console.log(`📄 CV received: ${req.file.originalname} for job ${job.title}`);

    // 3. Process asynchronously (don't block the response)
    processCandidate(candidate, req.file, job).catch(err => {
      console.error(`❌ Processing failed for ${candidate._id}:`, err.message);
    });

    res.status(201).json({
      message: 'CV received! Processing started.',
      candidateId: candidate._id,
      status: 'parsing'
    });

  } catch (err) {
    console.error('Apply error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Background processing pipeline:
 * Parse CV → Extract data → Score → Update status → Notify
 */
async function processCandidate(candidate, file, job) {
  try {
    // Step 1: Parse CV text
    console.log(`🔍 Parsing CV for candidate ${candidate._id}...`);
    const cvText = await extractTextFromFile(file.path, file.mimetype);
    candidate.cvText = cvText;
    candidate.status = 'scoring';
    candidate.statusHistory.push({ status: 'parsing', note: 'CV text extracted' });
    await candidate.save();

    // Step 2: Extract structured data with Gemini
    console.log(`🧠 Extracting CV data...`);
    const extracted = await extractCVData(cvText);
    candidate.name = extracted.name || 'Unknown';
    candidate.email = extracted.email;
    candidate.phone = extracted.phone;
    candidate.extracted = extracted;
    await candidate.save();

    // Step 3: Send "application received" WhatsApp
    if (candidate.whatsappNumber) {
      await notify('applicationReceived', candidate.whatsappNumber, {
        name: candidate.name, jobTitle: job.title
      });
    }

    // Step 4: Score candidate against job
    console.log(`📊 Scoring candidate ${candidate.name}...`);
    const scoreResult = await scoreCandidate(cvText, extracted, job);
    candidate.score = {
      overall: scoreResult.score,
      strengths: scoreResult.strengths,
      gaps: scoreResult.gaps,
      recommendation: scoreResult.recommendation,
      summary: scoreResult.summary
    };

    // Step 5: Route based on score
    if (scoreResult.score >= 80) {
      candidate.status = 'shortlisted';
      candidate.statusHistory.push({
        status: 'shortlisted', note: `Auto-shortlisted (score: ${scoreResult.score})`
      });
      if (candidate.whatsappNumber) {
        await notify('shortlisted', candidate.whatsappNumber, {
          name: candidate.name, jobTitle: job.title
        });
      }
    } else if (scoreResult.score >= 60) {
      candidate.status = 'under_review';
      candidate.statusHistory.push({
        status: 'under_review', note: `Sent to HR review (score: ${scoreResult.score})`
      });
      if (candidate.whatsappNumber) {
        await notify('underReview', candidate.whatsappNumber, {
          name: candidate.name, jobTitle: job.title
        });
      }
    } else {
      candidate.status = 'rejected';
      candidate.statusHistory.push({
        status: 'rejected', note: `Auto-rejected (score: ${scoreResult.score})`
      });
      if (candidate.whatsappNumber) {
        await notify('rejected', candidate.whatsappNumber, {
          name: candidate.name, jobTitle: job.title
        });
      }
    }

    // Update job candidate count
    await Job.findByIdAndUpdate(job._id, { $inc: { candidateCount: 1 } });

    await candidate.save();
    console.log(`✅ ${candidate.name}: score=${scoreResult.score}, status=${candidate.status}`);

  } catch (err) {
    candidate.status = 'received'; // Reset on failure
    candidate.statusHistory.push({ status: 'error', note: err.message });
    await candidate.save();
    throw err;
  }
}

// GET /api/candidates — List all candidates (optionally filter by jobId or status)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.jobId)  filter.jobId = req.query.jobId;
    if (req.query.status) filter.status = req.query.status;
    const candidates = await Candidate.find(filter).populate('jobId', 'title company').sort({ createdAt: -1 });
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/candidates/:id — Get single candidate
router.get('/:id', async (req, res) => {
  try {
    const c = await Candidate.findById(req.params.id).populate('jobId', 'title company requirements');
    if (!c) return res.status(404).json({ error: 'Candidate not found' });
    res.json(c);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
