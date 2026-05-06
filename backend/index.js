const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Webhooks must be mounted before express.json() — Clerk sends raw body
app.use('/api/webhooks', require('./routes/webhooks'));

app.use(express.json());

app.get('/', (req, res) => res.send('SkillBridge API is running'));

app.use('/api/batches', require('./routes/batches'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/institutions', require('./routes/institutions'));
app.use('/api/programme', require('./routes/programme'));

const prisma = require('./lib/prisma');

prisma.$connect()
  .then(() => {
    console.log('Database connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });
