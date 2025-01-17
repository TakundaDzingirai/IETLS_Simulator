// services/speechService.js - Service Logic for Speech Processing

const { SpeechClient } = require('@google-cloud/speech');

// Initialize Google Cloud Speech-to-Text Client
const client = new SpeechClient({
  keyFilename: 'config/your-key.json', // Replace with your Google Cloud key file path
});

/**
 * Transcribe audio using Google Cloud Speech-to-Text API
 * @param {Buffer} audioBuffer - The audio data as a Buffer
 * @returns {Promise<string>} - Transcribed text
 */
async function transcribeAudio(audioBuffer) {
  const audio = {
    content: audioBuffer.toString('base64'),
  };

  const config = {
    encoding: 'LINEAR16', // Adjust based on your audio format
    sampleRateHertz: 16000,
    languageCode: 'en-US',
  };

  const request = {
    audio,
    config,
  };

  try {
    const [response] = await client.recognize(request);
    return response.results.map(result => result.alternatives[0].transcript).join(' ');
  } catch (error) {
    console.error('Error during transcription:', error);
    throw new Error('Failed to transcribe audio.');
  }
}

module.exports = { transcribeAudio };
