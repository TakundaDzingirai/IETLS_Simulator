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

    async function calculateEnhancedFluency(
      tokens,
      wordCount,
      sentenceCount,

    ) {
      // 1. Define expanded filler words, repeated-phrase detection, etc.
      const fillerWords = ["um", "uh", "like", "you know", "sort of", "actually", "basically", "so..."];
      const fillerCount = tokens.filter((t) => fillerWords.includes(t.text.toLowerCase())).length;

      // 2. Lexical Diversity
      const uniqueWords = new Set(tokens.map((t) => t.text.toLowerCase()));
      const uniqueWordsCount = uniqueWords.size;
      const lexicalDiversity = wordCount > 0 ? uniqueWordsCount / wordCount : 0;

      // 3. Sentence Metrics
      const avgSentenceLength = wordCount / (sentenceCount || 1);
      // Reward having more than one sentence, but this is simplistic
      const sentenceVarietyBonus = sentenceCount > 1 ? 1 : 0;

      // 4. Timing Metrics
      const { duration = 0, pauseDuration = 0 } = timingData;
      // Speech Rate (words per minute)
      const speechRate = duration ? (wordCount / (duration / 60)) : 0;
      // Articulation Rate (excludes pause time)
      const effectiveSpeakingTime = Math.max(duration - pauseDuration, 0.1);
      const articulationRate = effectiveSpeakingTime
        ? (wordCount / (effectiveSpeakingTime / 60))
        : 0;

      // 5. Pause Metrics (Optional Example)
      // If you're tracking each pause individually, you might have an array of pause lengths.
      // For simplicity, assume total pause time > 2 seconds might be considered 'long'.
      let pausePenalty = 0;
      const pauseRatio = pauseDuration / duration;
      // Example thresholds:
      if (pauseRatio < 0.1) pausePenalty = 0;
      else if (pauseRatio < 0.2) pausePenalty = 0.5;
      else if (pauseRatio < 0.3) pausePenalty = 1;
      else pausePenalty = 2;

      // 6. Calculate Baseline Score
      // Start with a baseline of 7, then add/subtract
      let fluencyScore = 7;

      // 6a. Reward or penalize average sentence length (cap at +2)
      fluencyScore += Math.min(avgSentenceLength / 10, 2);

      // 6b. Penalty for filler words: each filler might subtract 0.25 points, for example
      fluencyScore -= fillerCount * 0.25;

      // 6c. Sentence variety bonus
      fluencyScore += sentenceVarietyBonus;

      // 6d. Pause penalty
      fluencyScore -= pausePenalty;

      // 6e. Speech/Articulation Rate
      // Suppose we want an optimal articulation rate of ~120–180 WPM for typical conversation
      if (articulationRate >= 120 && articulationRate <= 180) {
        fluencyScore += 1;  // Good articulation rate
      } else {
        fluencyScore -= 1;  // Too fast/slow
      }

      // 6f. Lexical Diversity
      // Reward moderate–high diversity (e.g., 0.4–0.7). 
      // Exact thresholds depend on your preference.
      if (lexicalDiversity > 0.4) {
        fluencyScore += 0.5;
      }
      if (lexicalDiversity > 0.6) {
        fluencyScore += 0.5;  // further bonus for very high diversity
      }

      // 7. Send a prompt to Generative AI for additional feedback 
      // (similar to your existing code):
      let prompt = `
        Compare my spoken response with the intended (correct) sentence:
        - **Spoken Response**: "${response}"
        - **Intended Sentence**: "${original}"
    
        1. Grammar Accuracy
        2. Vocabulary Match
        3. Fluency Suggestions
        4. Fluency Score: (0-9) (e.g Fluency Score: 9)
      `;

      try {
        console.log("Sending prompt to Generative AI for fluency analysis...");
        const result = await model.generateContent(prompt);
        const candidates = result.response?.candidates || [];
        const fluencyFeedback = candidates[0]?.content?.parts?.[0]?.text?.trim() || "";
        console.log(`fluencyFeedback: ${fluencyFeedback}`);

        // Attempt to parse an "AI-derived" fluency score from the text
        // 1. Remove asterisks so that "Fluency Score:" can be matched
        const cleanedFeedback = fluencyFeedback.replace(/\*/g, "");

        // 2. Capture a number (including optional decimal part) after "Fluency Score:"
        const matchScore = cleanedFeedback.match(/Fluency Score:\s*(\d+(\.\d+)?)/i);

        // 3. Convert the captured string into a float
        const aiFluencyScore = matchScore ? parseFloat(matchScore[1]) : null;

        // Now aiFluencyScore is a JavaScript number (e.g., 2, 3.5, etc.)

        console.log(aiFluencyScore);
        console.log(fluencyScore);

        if (aiFluencyScore !== null) {
          // Blend logic-based score with AI-based score
          fluencyScore = (fluencyScore + aiFluencyScore) / 2;
        }

        const cleanedFluencyFeedback = fluencyFeedback.replace(/Fluency score:\s*\d+(\.\d+)?/i, "").trim();
        corrections.push({ AI: cleanedFluencyFeedback });

      } catch (error) {
        console.warn("Generative AI failed to provide fluency feedback:", error.message);
      }

      // 8. Ensure final score is between 0 and 9
      fluencyScore = Math.max(0, Math.min(fluencyScore, 9));
      return fluencyScore;
    }


    const scores = {
      fluency: await calculateEnhancedFluency(tokens, wordCount, sentenceCount), // Updated fluency logic
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
      part: part
    };
  } catch (error) {
    console.error('Error generating feedback:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = { generateTestPartFeedback };
