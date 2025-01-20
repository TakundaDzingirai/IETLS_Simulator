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
async function generateFeedback(response) {
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


        // Step 2: Use Generative AI for pronunciation feedback
        let pronunciationFeedback = '';


        const prompt = `when i spoke it sounded like:${response},Provide feedback,focus helping on helping me pronounce each word correctly.`;

        try {
            console.log("Trying to gemini Ai...");
            const result = await model.generateContent(prompt);

            // Extract pronunciation feedback
            const candidates = result.response?.candidates || [];
            if (candidates.length > 0) {
                pronunciationFeedback = candidates[0]?.content?.parts?.[0]?.text?.trim() || '';
            }

        } catch (error) {
            console.warn('Generative AI failed to provide pronunciation feedback:', error.message);
        }
        console.log(pronunciationFeedback);


        return {
            pronunciationFeedback
        };
    } catch (error) {
        console.error('Error generating feedback:', error.response?.data || error.message);
        throw error;
    }


}
module.exports = { generateFeedback }