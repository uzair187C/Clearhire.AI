require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, Candidate, Job } = require('./mongoClient');

async function resetDB() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // 1. Delete all candidates
    const deleteResult = await Candidate.deleteMany({});
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} candidates.`);

    // 2. Add new job postings if none exist, or just add them
    const jobs = [
      {
        title: 'Senior DevOps Engineer',
        company: 'ClearHire Tech',
        description: 'We are looking for an experienced DevOps engineer to build and manage our scalable cloud infrastructure.',
        requirements: {
          skills: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Docker'],
          minExperience: 5,
          location: 'Remote',
          maxBudget: '$140,000'
        },
        status: 'active',
        candidateCount: 0
      },
      {
        title: 'Frontend React Developer',
        company: 'ClearHire UI',
        description: 'Join our team to build stunning and interactive user interfaces for our AI-powered products.',
        requirements: {
          skills: ['React', 'JavaScript', 'CSS', 'Figma', 'Vite'],
          minExperience: 3,
          location: 'New York, NY',
          maxBudget: '$110,000'
        },
        status: 'active',
        candidateCount: 0
      },
      {
        title: 'Product Manager',
        company: 'ClearHire Strategy',
        description: 'Lead the product vision and work closely with engineering and design to deliver high-impact AI solutions.',
        requirements: {
          skills: ['Agile', 'Jira', 'Product Strategy', 'UI/UX Principles', 'Leadership'],
          minExperience: 4,
          location: 'San Francisco, CA',
          maxBudget: '$130,000'
        },
        status: 'active',
        candidateCount: 0
      }
    ];

    const insertedJobs = await Job.insertMany(jobs);
    console.log(`✨ Added ${insertedJobs.length} new job postings.`);

    // Reset candidate counts on any existing jobs
    await Job.updateMany({}, { $set: { candidateCount: 0 } });
    console.log(`🔄 Reset candidate counts on existing jobs to 0.`);

    console.log('✅ Database reset complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

resetDB();
