// app.js - Main Entry Point for Backend
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const speechRoutes = require('./routes/punctuate');
const testRoutes = require('./routes/test');
const practiceRoutes = require('./routes/practice');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Debugging Middleware: Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Request body:', req.body); // Log the body
  next();
});

// API Routes
app.use('/api/punctuate', speechRoutes);
app.use('/api/test', testRoutes);
app.use('/api/practice', practiceRoutes);

// Root Endpoint
app.get('/', (req, res) => {
  res.send('IELTS Simulator Backend is running.');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Something went wrong!' });
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
