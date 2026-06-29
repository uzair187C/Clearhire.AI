const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set in environment');
  await mongoose.connect(uri);
}

/* ── Job Schema ── */
const jobSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  company:      { type: String, default: 'ClearHire Demo Co.' },
  description:  String,
  requirements: {
    skills:          [String],
    minExperience:   { type: Number, default: 0 },
    maxBudget:       String,
    location:        String,
    employmentType:  { type: String, default: 'Full-time' },
    additionalNotes: String
  },
  status:         { type: String, enum: ['active', 'closed'], default: 'active' },
  candidateCount: { type: Number, default: 0 },
  createdAt:      { type: Date, default: Date.now }
});

/* ── Candidate Schema ── */
const candidateSchema = new mongoose.Schema({
  jobId:           { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  name:            String,
  email:           String,
  phone:           String,
  whatsappNumber:  String,
  cvFileName:      String,
  cvText:          String,
  extracted: {
    skills:            [String],
    experience:        Number,
    education:         String,
    previousCompanies: [String],
    certifications:    [String],
    summary:           String
  },
  score: {
    overall:        { type: Number, default: 0 },
    strengths:      [String],
    gaps:           [String],
    recommendation: { type: String, enum: ['shortlist', 'review', 'reject', 'pending'], default: 'pending' },
    summary:        String
  },
  status: {
    type: String,
    enum: ['received','parsing','scoring','scored','shortlisted','under_review',
           'interview_scheduled','selected','rejected','offer_sent'],
    default: 'received'
  },
  statusHistory: [{
    status:    String,
    timestamp: { type: Date, default: Date.now },
    note:      String,
    by:        { type: String, default: 'system' }
  }],
  interviewDate: Date,
  hrNotes:       String,
  createdAt:     { type: Date, default: Date.now },
  updatedAt:     { type: Date, default: Date.now }
});

candidateSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Job       = mongoose.model('Job', jobSchema);
const Candidate = mongoose.model('Candidate', candidateSchema);

module.exports = { connectDB, Job, Candidate };
