require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const { connectDB } = require('./mongoClient');

const app  = express();
const PORT = process.env.PORT || 8080;

// ── Middleware ──
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads dir exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ── Routes ──
app.use('/api/jobs',       require('./routes/jobs'));
app.use('/api/candidates', require('./routes/candidates'));
app.use('/api/uipath',     require('./routes/uipath'));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ClearHire AI Agent',
    timestamp: new Date().toISOString()
  });
});

// WhatsApp webhook verification (for future incoming messages)
app.get('/api/webhook', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === process.env.WA_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// ── Start ──
async function start() {
  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`\n🚀 ClearHire AI Agent running on port ${PORT}`);
    console.log(`   Health:     http://localhost:${PORT}/health`);
    console.log(`   Jobs:       http://localhost:${PORT}/api/jobs`);
    console.log(`   Candidates: http://localhost:${PORT}/api/candidates`);
    console.log(`   UiPath:     http://localhost:${PORT}/api/uipath/*\n`);

    try {
      await connectDB();
      console.log('✅ MongoDB connected');
    } catch (err) {
      console.error('❌ MongoDB connection failed. Please check Atlas Network Access (0.0.0.0/0):', err.message);
    }
  });
}

start();
