// server/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const IP = '192.168.100.149';

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  coverPhoto: { type: String },
  profilePhoto: { type: String },
  favorites: [{ type: String }],
  feedback: [{ text: String, date: { type: Date, default: Date.now } }],
});

const User = mongoose.model('User', userSchema);

// Job Schema
const jobSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, default: 'Untitled' },
  company: { type: String, default: 'Unknown' },
  location: { type: String, default: 'N/A' },
  description: { type: String, default: 'No description available' },
  category: { type: String, default: 'General' },
  salary: { type: String, default: 'Not specified' },
  image: { type: String },
});

const Job = mongoose.model('Job', jobSchema);

// Fetch and Seed Jobs from jsonfakery API
const fetchAndSeedJobs = async () => {
  try {
    const response = await axios.get('https://jsonfakery.com/job-posts');
    const jobData = response.data.data || response.data; // Handle nested or direct data
    const jobs = jobData.map((job) => ({
      id: job.id.toString(),
      title: job.title || 'Untitled',
      company: job.company || 'Unknown',
      location: job.location || 'N/A',
      description: job.description || 'No description available',
      category: job.category || 'General',
      salary: job.salary || 'Not specified',
      image: job.image || 'https://via.placeholder.com/100?text=Job',
    }));

    // Clear existing jobs and insert new ones
    await Job.deleteMany({});
    await Job.insertMany(jobs);
    console.log('Jobs seeded successfully');
  } catch (err) {
    console.error('Error fetching or seeding jobs:', err.message);
  }
};

// Seed jobs on server start
fetchAndSeedJobs();

// API Routes
// User Signup
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: 'Username already exists' });
    const user = new User({ username, password });
    await user.save();
    res.status(201).json({ message: 'User created', username });
  } catch (err) {
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  try {
    const user = await User.findOne({ username, password });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    res.status(200).json({
      username: user.username,
      coverPhoto: user.coverPhoto,
      profilePhoto: user.profilePhoto,
      favorites: user.favorites || [],
      feedback: user.feedback || [],
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// Update User Profile
app.put('/api/user/:username', async (req, res) => {
  const { username } = req.params;
  const { coverPhoto, profilePhoto, favorites, feedback } = req.body;
  try {
    const updateData = {};
    if (coverPhoto !== undefined) updateData.coverPhoto = coverPhoto;
    if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto;
    if (favorites !== undefined) updateData.favorites = favorites;
    if (feedback !== undefined) updateData.feedback = feedback;
    const user = await User.findOneAndUpdate(
      { username },
      { $set: updateData },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({
      username: user.username,
      coverPhoto: user.coverPhoto,
      profilePhoto: user.profilePhoto,
      favorites: user.favorites,
      feedback: user.feedback,
    });
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
});

// Fetch Jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await Job.find();
    if (jobs.length === 0) {
      await fetchAndSeedJobs(); // Re-seed if no jobs found
      const refreshedJobs = await Job.find();
      return res.status(200).json(refreshedJobs);
    }
    res.status(200).json(jobs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch jobs', error: err.message });
  }
});

// Start Server
app.listen(PORT, IP, () => {
  console.log(`Server running on http://${IP}:${PORT}`);
});