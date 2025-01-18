const axios = require('axios');
require('dotenv').config(); // Load environment variables

// Validate Environment Variables
if (!process.env.GOOGLE_CLOUD_KEY) {
  throw new Error('Missing GOOGLE_CLOUD_KEY in environment variables');
}

// Base URL for the Natural Language API
const API_URL = 'https://language.googleapis.com/v1/documents:analyzeSyntax';

/**
 * Generate feedback for a specific IELTS test part
 * @param {string} part - The part of the IELTS test (e.g., 'part1', 'part2', 'part3')
 * @param {string} response - The user's spoken response
 * @returns {Promise<Object>} - Feedback with scores, suggestions, and corrections
 */
async function generateTestPartFeedback(part, response) {
  try {
    if (!response || !response.trim()) {
      throw new Error('Response is empty or invalid.');
    }

    const document = {
      document: {
        type: 'PLAIN_TEXT',
        content: response,
      },
      encodingType: 'UTF8',
    };

    const { data } = await axios.post(`${API_URL}?key=${process.env.GOOGLE_CLOUD_KEY}`, document, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Parse tokens and perform analysis
    const tokens = data.tokens.map(token => ({
      text: token.text.content,
      partOfSpeech: token.partOfSpeech.tag,
    }));

    // Enhanced scoring logic
    const wordCount = response.split(' ').length;
    const sentenceCount = response.split(/[.!?]/).filter(Boolean).length;
    const avgSentenceLength = wordCount / sentenceCount || 1;

    const scores = {
      fluency: Math.min(avgSentenceLength / 15 * 9, 9), // Longer sentences may indicate better fluency
      grammar: 8 - (tokens.filter(t => t.partOfSpeech === 'X').length / wordCount) * 8, // Penalize unclassified words
      vocabulary: 6 + (tokens.filter(t => ['ADJ', 'ADV'].includes(t.partOfSpeech)).length / wordCount) * 3, // Reward descriptive words
      pronunciation: 7.5, // Placeholder score (add a pronunciation analysis if needed)
    };

    // Generate feedback and corrections
    const feedbackMessages = [];
    const corrections = [];

    tokens.forEach((token, index) => {
      const nextToken = tokens[index + 1];

      // Check for incorrect pronouns
      if (token.partOfSpeech === 'PRON' && token.text.toLowerCase() === 'them') {
        corrections.push(`The pronoun "${token.text}" seems incorrect here. Consider using "their" or another appropriate pronoun.`);
      }

      // Check for awkward prepositional phrases
      if (token.partOfSpeech === 'ADP' && nextToken && nextToken.partOfSpeech === 'DET' && nextToken.text.toLowerCase() === 'the') {
        corrections.push(`The phrase "${token.text} ${nextToken.text}" seems awkward. Consider revising.`);
      }

      // Identify unclassified or unclear words
      if (token.partOfSpeech === 'X') {
        corrections.push(`The word "${token.text}" might be incorrect or unclear.`);
      }

      // Look for inappropriate use of adjectives
      if (token.partOfSpeech === 'ADJ' && nextToken && nextToken.partOfSpeech === 'NOUN' && nextToken.text.toLowerCase() === 'anyone') {
        corrections.push(`The phrase "${token.text} ${nextToken.text}" seems grammatically incorrect. Consider revising.`);
      }
    });

    if (scores.fluency < 6) {
      feedbackMessages.push('Try to use longer, more complex sentences to improve fluency.');
    } else {
      feedbackMessages.push('Your fluency is strong; continue practicing to maintain this level.');
    }

    if (scores.grammar < 7) {
      feedbackMessages.push('Focus on correcting subject-verb agreement and avoiding sentence fragments.');
    } else {
      feedbackMessages.push('Your grammar usage is good, with few noticeable errors.');
    }

    if (scores.vocabulary < 7) {
      feedbackMessages.push('Incorporate more descriptive words, such as adjectives and adverbs, to enhance your response.');
    } else {
      feedbackMessages.push('You used a good range of vocabulary. Keep exploring topic-specific terms.');
    }

    return {
      feedback: 'Text analyzed successfully with Google Natural Language API.',
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
