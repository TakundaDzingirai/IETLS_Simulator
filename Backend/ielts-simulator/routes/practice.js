const express = require('express');
const router = express.Router();
const { generateTestPartFeedback } = require('../services/testService');

router.post('/feedback', async (req, res) => {
    try {
        const { response, original, timingData } = req.body;
        console.log('Practice Mode - Request body:', req.body);

        // Call the feedback generator function
        const feedback = await generateTestPartFeedback('practice', response, original, timingData);

        // Return the feedback
        res.json({ feedback });
    } catch (error) {
        console.error('Error in /practice/feedback route:', error.message);
        res.status(500).send({ error: 'Failed to generate feedback in Practice Mode' });
    }
});

module.exports = router;
