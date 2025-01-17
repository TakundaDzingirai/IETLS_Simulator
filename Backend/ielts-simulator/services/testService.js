// services/testService.js - Service Logic for IELTS Test Feedback

const { Configuration, OpenAIApi } = require('openai');

// Configure OpenAI API
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // Store API key in an environment variable
});
const openai = new OpenAIApi(configuration);

/**
 * Generate feedback for a specific IELTS test part
 * @param {string} part - The part of the IELTS test (e.g., 'part1', 'part2', 'part3')
 * @param {string} response - The user's spoken response
 * @returns {Promise<Object>} - Feedback with scores and suggestions
 */
async function generateTestPartFeedback(part, response) {
  try {
    if (!response || !response.trim()) {
      throw new Error('Response is empty or invalid.');
    }

    // Use OpenAI GPT for grammar and vocabulary feedback
    const prompt = `
      Analyze the following response for grammar and coherence:
      Response: "${response}"
      
      Provide:
      1. A corrected version of the response.
      2. Detailed feedback on grammar issues and suggestions for improvement.
    `;

    const gptResponse = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 500,
      temperature: 0.7,
    });

    const feedbackText = gptResponse.data.choices[0].text.trim();

    // Example scoring logic (can be refined based on GPT analysis)
    const scores = {
      fluency: Math.min(response.split(' ').length / 10, 9),
      grammar: Math.random() * 2 + 7, // Replace with dynamic grammar score if possible
      vocabulary: Math.random() * 2 + 6, // Replace with vocabulary richness analysis
      pronunciation: Math.random() * 2 + 7, // Placeholder for pronunciation logic
    };

    return {
      scores,
      feedback: feedbackText,
      overall: (scores.fluency + scores.grammar + scores.vocabulary + scores.pronunciation) / 4,
    };
  } catch (error) {
    console.error('Error generating feedback:', error);
    throw new Error('Failed to generate feedback for the test part.');
  }
}

module.exports = { generateTestPartFeedback };
