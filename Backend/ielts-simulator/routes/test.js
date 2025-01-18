const express = require('express');
const router = express.Router();
const { generateTestPartFeedback } = require('../services/testService');

router.post('/feedback', async (req, res) => {
    try {
      const { part, response, original, timingData } = req.body;
      console.log('Route handler - Request body:', req.body);
      const feedback = await generateTestPartFeedback(part, response, original, timingData);
      res.json({ feedback });
    } catch (error) {
      console.error('Error in /feedback route:', error.message);
      res.status(500).send({ error: 'Failed to generate feedback' });
    }
  });

module.exports = router;

