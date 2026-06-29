// Quick test script — run with: node test.js
const http = require('http');

function post(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost', port: 8080, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:8080${path}`, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    }).on('error', reject);
  });
}

async function main() {
  console.log('\n=== ClearHire AI Test ===\n');

  // 1. Health check
  const health = await get('/health');
  console.log('Health:', health);

  // 2. Create a job
  console.log('\n--- Creating test job ---');
  const job = await post('/api/jobs', {
    title: 'Node.js Developer',
    company: 'TechCorp Pakistan',
    description: 'Looking for an experienced Node.js developer to build REST APIs and microservices.',
    requirements: {
      skills: ['Node.js', 'Express', 'MongoDB', 'REST APIs', 'JavaScript'],
      minExperience: 3,
      maxBudget: '$2000/month',
      location: 'Remote (Pakistan)',
      employmentType: 'Full-time',
      additionalNotes: 'Cloud deployment experience (AWS/GCP) is a plus'
    }
  });
  console.log('Job created:', job.title, '| ID:', job._id);

  // 3. List jobs
  const jobs = await get('/api/jobs');
  console.log('Total jobs:', jobs.length);

  console.log('\n✅ Backend is working! Job ID for CV testing:', job._id);
  console.log('Next: test CV upload with a real PDF file.\n');
}

main().catch(console.error);
