// routes/test.js - IELTS Test Simulation API Routes

const express = require('express');
const router = express.Router();
const { generateTestPartFeedback } = require('../services/testService');

// POST: Generate Feedback for Test Part
router.post('/feedback', async (req, res) => {
  try {
    const { part, response } = req.body;
    if (!part || !response) {
      return res.status(400).send({ error: 'Test part and response are required.' });
    }

    const feedback = await generateTestPartFeedback(part, response);
    res.send({ feedback });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to generate feedback.' });
  }
});

module.exports = router;
