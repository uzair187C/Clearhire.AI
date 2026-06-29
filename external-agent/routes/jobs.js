const express = require('express');
const router  = express.Router();
const { Job } = require('../mongoClient');

// POST /api/jobs — Create a new job posting
router.post('/', async (req, res) => {
  try {
    const { title, company, description, requirements } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });

    const job = await Job.create({ title, company, description, requirements });
    console.log(`📋 Job created: ${job.title} (${job._id})`);
    res.status(201).json(job);
  } catch (err) {
    console.error('Job creation error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs — List all jobs
router.get('/', async (_req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs/:id — Get single job
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/jobs/:id — Update job (e.g. close it)
router.patch('/:id', async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
