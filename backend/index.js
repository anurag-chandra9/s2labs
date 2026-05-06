const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://s2labs.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: ${origin} not allowed`));
  },
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
app.use('/api/users', require('./routes/users'));

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
