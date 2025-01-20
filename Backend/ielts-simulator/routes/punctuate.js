const express = require('express');
const router = express.Router();
const { generateFeedback } = require('../services/punctuntionService');

router.post('/feedback', async (req, res) => {
  try {
    const { response } = req.body;
    console.log('punctuate Mode - Request body:', req.body);

    // Call the feedback generator function
    const feedback = await generateFeedback(response);

    // Return the feedback
    res.json({ feedback });
  } catch (error) {
    console.error('Error in /punctuate/feedback route:', error.message);
    res.status(500).send({ error: 'Failed to generate feedback in Practice Mode' });
  }
});

module.exports = router;
