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

        // Part 1: Each item is { response: "...", questions: "..." }
        for (const entry of responses.part1) {
            const { response: userResponse, questions } = entry;
            const result = await generateTestPartFeedback(
                'part1',
                userResponse,
                questions,
                timingData
            );
            feedback.part1.push(result);
        }

        // Part 2
        for (const entry of responses.part2) {
            const { response: userResponse, questions } = entry;
            const result = await generateTestPartFeedback(
                'part2',
                userResponse,
                questions,
                timingData
            );
            // NOTE: previously you were pushing part2 results into feedback.part3. Fixed here:
            feedback.part2.push(result);
        }

        // Part 3
        for (const entry of responses.part3) {
            const { response: userResponse, questions } = entry;
            const result = await generateTestPartFeedback(
                'part3',
                userResponse,
                questions,
                timingData
            );
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
