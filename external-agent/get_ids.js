require('dotenv').config();
const { Job, Candidate, connectDB } = require('./mongoClient');
const mongoose = require('mongoose');

async function getIds() {
  try {
    await connectDB();
    const job = await Job.findOne();
    const candidate = await Candidate.findOne();
    console.log("Job ID:", job ? job._id.toString() : "None found");
    console.log("Candidate ID:", candidate ? candidate._id.toString() : "None found");
  } catch (e) {
    console.error(e);
  } finally {
    mongoose.disconnect();
  }
}
getIds();
