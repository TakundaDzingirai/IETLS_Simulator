// routes/speech.js - Speech Processing API Routes

const express = require('express');
const router = express.Router();
const { transcribeAudio } = require('../services/speechService');

// POST: Transcribe Audio
router.post('/transcribe', async (req, res) => {
  try {
    const { audio } = req.body;
    if (!audio) {
      return res.status(400).send({ error: 'Audio data is required.' });
    }

    const transcription = await transcribeAudio(audio);
    res.send({ transcription });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to process audio.' });
  }
});

module.exports = router;
