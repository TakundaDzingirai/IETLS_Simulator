const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config(); // Load environment variables

// Validate Environment Variables
if (!process.env.GOOGLE_CLOUD_KEY) {
  throw new Error('Missing GOOGLE_CLOUD_KEY in environment variables');
}

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Missing GEMINI_API_KEY in environment variables');
}

// Initialize Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Base URL for Google Natural Language API
const GOOGLE_API_URL = 'https://language.googleapis.com/v1/documents:analyzeSyntax';

/**
 * Generate feedback for a specific IELTS test part
 * @param {string} part - The part of the IELTS test (e.g., 'part1', 'part2', 'part3')
 * @param {string} response - The user's spoken response
 * @param {string} original - (Optional) The intended sentence for pronunciation comparison
 * @returns {Promise<Object>} - Feedback with scores, suggestions, and corrections
 */
async function generateTestPartFeedback(part, response, original = '', timingData = {}) {
  try {
    if (!response || !response.trim()) {
      throw new Error('Response is empty or invalid.');
    }

    // Step 1: Use Google Natural Language API for token analysis
    const document = {
      document: {
        type: 'PLAIN_TEXT',
        content: response,
      },
      encodingType: 'UTF8',
    };

    const { data: googleData } = await axios.post(`${GOOGLE_API_URL}?key=${process.env.GOOGLE_CLOUD_KEY}`, document, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const tokens = googleData.tokens.map(token => ({
      text: token.text.content,
      partOfSpeech: token.partOfSpeech.tag,
    }));

    // Step 2: Use Generative AI for pronunciation feedback
    let pronunciationFeedback = '';
    console.log(`original: ${original}`)
    if (original) {
      const prompt = `the read this sentence out loud: "${original}". but when spoke it sounded like:${response},Provide feedback if what i read is different from what i spoke,focus helping on helping me pronounce each word correctly.`;

      try {
        console.log("Trying to gemini Ai...");
        const result = await model.generateContent(prompt);

        // Extract pronunciation feedback
        const candidates = result.response?.candidates || [];
        if (candidates.length > 0) {
          pronunciationFeedback = candidates[0]?.content?.parts?.[0]?.text?.trim() || '';
        }

        console.log(`feedbackObject: ${JSON.stringify(result.response, null, 2)}`);
        console.log(`pronunciationFeedback: ${pronunciationFeedback}`);
      } catch (error) {
        console.warn('Generative AI failed to provide pronunciation feedback:', error.message);
      }

    }

    // Step 3: Scoring logic based on tokens
    const wordCount = response.split(' ').length;
    const sentenceCount = response.split(/[.!?]/).filter(Boolean).length;
    const avgSentenceLength = wordCount / sentenceCount || 1;
    const corrections = [];

    async function calculateEnhancedFluency(tokens, wordCount, sentenceCount, response, timingData = {}) {
      const fillerWords = ['um', 'uh', 'like', 'you know', 'sort of'];
      const fillerCount = tokens.filter(token => fillerWords.includes(token.text.toLowerCase())).length;

      const avgSentenceLength = wordCount / sentenceCount || 1;
      const sentenceVariety = sentenceCount > 1 ? 1 : 0.5; // Boost fluency if multiple sentences are present

      // Timing metrics
      const { totalDuration, pauseDurations = [] } = timingData;
      const speechRate = totalDuration ? wordCount / (totalDuration / 60) : 0; // Words per minute
      const avgPauseDuration = pauseDurations.length ? pauseDurations.reduce((a, b) => a + b, 0) / pauseDurations.length : 0;
      const pausePenalty = avgPauseDuration > 2 ? 1 : 0; // Penalize for long pauses (>2 seconds)

      // Calculate baseline fluency
      let fluencyScore = 7; // Start with a baseline
      fluencyScore += Math.min(avgSentenceLength / 10, 2); // Reward longer sentences up to a cap
      fluencyScore -= fillerCount * 0.5; // Penalize fillers
      fluencyScore += sentenceVariety; // Reward variety
      fluencyScore -= pausePenalty; // Penalize long pauses
      fluencyScore += speechRate > 100 && speechRate < 160 ? 1 : -1; // Reward optimal speech rate (100-160 WPM)

      // Send a prompt to Generative AI for additional fluency feedback
      try {
        const prompt = `Compare my spoken response with the intended (correct) sentence:
- **Spoken Response**: "${response}"
- **Intended Sentence**: "${original}"

Please analyze the following aspects:

1. **Grammar Accuracy**: Identify any grammatical errors or structural deviations in my spoken response compared to the intended sentence.
2. **Vocabulary Match**: Highlight words in my spoken response that differ from the intended sentence and suggest more accurate alternatives where applicable.
3. **Fluency Suggestions**: Provide actionable tips to improve clarity, pace, and natural rhythm in my speech.
4. **Fluency Score**: Assign a score between 0 and 9 (e.g., 7) to evaluate overall fluency.
Ensure the feedback is concise, clear, and easy to implement.`;

        console.log("Sending prompt to Generative AI for fluency analysis...");
        const result = await model.generateContent(prompt);
        const candidates = result.response?.candidates || [];
        const fluencyFeedback = candidates[0]?.content?.parts?.[0]?.text?.trim() || '';
        console.log(`fluencyFeedback: ${fluencyFeedback}`);


        // Parse the AI's score and feedback
        const matchScore = fluencyFeedback.match(/Fluency score: (\d+(\.\d+)?)/i);
        const aiFluencyScore = matchScore ? parseFloat(matchScore[1]) : null;

        if (aiFluencyScore !== null) {
          fluencyScore = (fluencyScore + aiFluencyScore) / 2; // Combine AI score with logic-based score
        }
        const cleanedFluencyFeedback = fluencyFeedback.replace(/Fluency score: \d+(\.\d+)?/i, "").trim();

        // Push the cleaned feedback into the corrections array
        corrections.push({ AI: cleanedFluencyFeedback });

        //   console.log("AI Fluency Feedback:", fluencyFeedback);
      } catch (error) {
        console.warn('Generative AI failed to provide fluency feedback:', error.message);
      }

      return Math.max(0, Math.min(fluencyScore, 9)); // Ensure the score stays between 0 and 9
    }


    const scores = {
      fluency: await calculateEnhancedFluency(tokens, wordCount, sentenceCount, response, timingData), // Updated fluency logic
      grammar: 9 - (tokens.filter(t => t.partOfSpeech === 'X').length / wordCount) * 8, // Penalize unclassified words
      vocabulary: 6 + (tokens.filter(t => ['ADJ', 'ADV'].includes(t.partOfSpeech)).length / wordCount) * 3, // Reward descriptive words
      pronunciation: pronunciationFeedback ? 7.5 : 7, // Adjust based on Generative AI feedback
    };


    // Generate feedback and corrections
    const feedbackMessages = [];

    let tokenFeedback = ""
    tokens.forEach((token, index) => {
      const nextToken = tokens[index + 1];

      // Check for incorrect pronouns
      if (token.partOfSpeech === 'PRON' && token.text.toLowerCase() === 'them') {
        // corrections.push(`The pronoun "${token.text}" seems incorrect here. Consider using "their" or another appropriate pronoun.`);
        tokenFeedback += `The pronoun "${token.text}" seems incorrect here. Consider using "their" or another appropriate pronoun.\n`
      }

      // Check for awkward prepositional phrases
      if (token.partOfSpeech === 'ADP' && nextToken && nextToken.partOfSpeech === 'DET' && nextToken.text.toLowerCase() === 'the') {
        tokenFeedback += `The phrase "${token.text} ${nextToken.text}" seems awkward. Consider revising.\n`;
      }

      // Identify unclassified or unclear words
      if (token.partOfSpeech === 'X') {
        tokenFeedback += `The word "${token.text}" might be incorrect or unclear.\n`;
      }
    });
    if (tokenFeedback) {
      corrections.push({ Tokens: tokenFeedback });
    }


    if (pronunciationFeedback) {
      feedbackMessages.push(`Pronunciation feedback: ${pronunciationFeedback}`);
    }
    return {
      feedback: 'Text analyzed successfully with Google Natural Language API and Generative AI.',
      analysis: {
        tokens,
      },
      scores,
      suggestions: feedbackMessages,
      corrections,
    };
  } catch (error) {
    console.error('Error generating feedback:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = { generateTestPartFeedback };
