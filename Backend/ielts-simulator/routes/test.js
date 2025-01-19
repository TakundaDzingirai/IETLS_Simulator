const express = require('express');
const router = express.Router();
const { generateTestPartFeedback } = require('../services/testService');
const { ieltsTests } = require('../services/ieltsTest');

// Mock questions for test mode
router.post('/start', (req, res) => {
    console.log('Test Mode - Start Test');

    // Select a random test from the ieltsTests array
    const randomIndex = Math.floor(Math.random() * ieltsTests.length);
    console.log(`index:${randomIndex}`);
    const testQuestions = ieltsTests[randomIndex];
    console.log(`testQ:${testQuestions}`);

    // Send the selected test to the client
    res.json({ testQuestions });
});

// Submit Test
router.post('/submit', async (req, res) => {
    try {
        const { responses, timingData } = req.body;
        console.log('Test Mode - Submit Test:', req.body);

        const feedback = {
            part1: [],
            part2: [],
            part3: [],
        };

        // Generate feedback for Part 1
        for (const response of responses.part1) {
            const result = await generateTestPartFeedback('part1', response[0], response[1], timingData);
            feedback.part1.push(result);
        }

        for (const response of responses.part2) {
            const result = await generateTestPartFeedback('part2', response[0], response[1], timingData);
            feedback.part3.push(result);
        }

        // Generate feedback for Part 3
        for (const response of responses.part3) {
            const result = await generateTestPartFeedback('part3', response[0], response[1], timingData);
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
