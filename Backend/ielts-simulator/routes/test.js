const express = require('express');
const router = express.Router();
const { generateTestPartFeedback } = require('../services/testService');

router.post('/feedback', async (req, res) => {
  try {
    const { part, response, original } = req.body;
    console.log('Route handler - Request body:', req.body); // Debug log
    const feedback = await generateTestPartFeedback(part, response, original);
    res.json({ feedback });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
