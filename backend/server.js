const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express'), cors = require('cors'), mongoose = require('mongoose');
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use('/api', require('./routes'));

// Centralized error handler
app.use((e, req, res, next) => {
  if (e.name === 'CastError') {
    return res.status(404).json({ message: 'Requested item not found' });
  }
  if (e.name === 'MulterError') {
    const msg = e.code === 'LIMIT_FILE_SIZE' ? 'File size exceeds 5MB limit' : e.message;
    return res.status(400).json({ message: msg });
  }
  res.status(e.status || 500).json({ message: e.message || 'Server error' });
});

const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-quiz-generator';

mongoose.connect(mongoUri)
  .then(() => app.listen(port, () => console.log(`API running on http://localhost:${port}`)))
  .catch(e => {
    console.error('MongoDB connection failed:', e.message);
    console.error('Make sure MongoDB is running or update MONGO_URI in backend/.env');
    process.exit(1);
  });

