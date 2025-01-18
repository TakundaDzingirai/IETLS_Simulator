const express = require('express');
const router = express.Router();
const { generateTestPartFeedback } = require('../services/testService');

// Mock questions for test mode
const testQuestions = {
    part1: ['What is your name?', 'Where are you from?', 'Do you enjoy your work or studies?'],
    part2: 'Describe a time when you helped someone. Include what happened, who you helped, and how you felt.',
    part3: ['Why do people volunteer?', 'What are the benefits of helping others?'],
};

// Start Test
router.post('/start', (req, res) => {
    console.log('Test Mode - Start Test');
    res.json({ testQuestions });
});

// Submit Test
router.post('/submit', async (req, res) => {
    try {
        const { responses, timingData } = req.body;
        console.log('Test Mode - Submit Test:', req.body);

        const feedback = {
            part1: [],
            part2: null,
            part3: [],
        };

        // Generate feedback for Part 1
        for (const response of responses.part1) {
            const result = await generateTestPartFeedback('part1', response, '', timingData);
            feedback.part1.push(result);
        }

        // Generate feedback for Part 2
        feedback.part2 = await generateTestPartFeedback('part2', responses.part2, '', timingData);

        // Generate feedback for Part 3
        for (const response of responses.part3) {
            const result = await generateTestPartFeedback('part3', response, '', timingData);
            feedback.part3.push(result);
        }

        // Return aggregated feedback
        res.json({ feedback });
    } catch (error) {
        console.error('Error in /test/submit route:', error.message);
        res.status(500).send({ error: 'Failed to generate feedback in Test Mode' });
    }
});

module.exports = router;
