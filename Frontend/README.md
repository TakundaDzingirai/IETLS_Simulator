### **Setup Instructions for Local Development**

#### **Prerequisites**
1. **Node.js**: Install Node.js (v14+ recommended) for both backend and frontend environments.
2. **React**: Ensure a React environment is set up (using Vite).
3. **Google APIs**: Set up access to Google Cloud Platform for the following:
   - **Google Natural Language API**: For syntax analysis.
   - **Google Generative AI (Gemini)**: For AI-driven feedback.
4. **Environment Variables**: Create a `.env` file for API keys and configuration:
  
   GOOGLE_CLOUD_KEY=<Your_Google_Cloud_API_Key>
   GEMINI_API_KEY=<Your_Gemini_API_Key>
   

#### **Frontend Setup**
1. Clone the repository:
   
   git clone <repo-url>
   cd <repo-url>/frontend
  
2. Install dependencies:
  
   npm install
  
3. Start the development server:
   
   npm start
   
4. Ensure the frontend is pointing to the correct backend URL in `axios` requests (`http://localhost:5000` by default).

#### **Backend Setup**
1. Navigate to the backend directory:
   
   cd <repo-url>/Backend
  
2. Install dependencies:
  
   npm install
  
3. Start the backend server:
   
   node server.js
  
4. Verify that the backend is running on `http://localhost:5000`.

---

### **Source Code & Documentation**

#### **Frontend (React)**
The frontend captures user speech in real time using the `SpeechRecognition` API and processes it as follows:
1. **Real-Time Transcription**: Combines interim and final transcripts into a seamless display.
2. **Punctuation Handling**:
   - Inserts commas or periods based on pauses (e.g., 0.8s for commas, 1.5s for periods).
   - Tracks pauses to assess fluency.
3. **Feedback**:
   - Sends transcription data to the backend for scoring and suggestions.
   - Displays real-time feedback and scores.

#### **Backend (Node.js)**
1. **Google Natural Language API**:
   - Analyzes syntax, including tokenized words and parts of speech.
   - Detects grammatical issues, awkward phrases, and unclassified words.
2. **Gemini Generative AI**:
   - Provides detailed feedback on pronunciation and fluency.
   - Scores and suggestions are generated dynamically using an AI-driven prompt.
3. **Scoring Logic**:
   - Calculates fluency, grammar, vocabulary, and pronunciation scores (scale of 0–9).
   - Uses advanced metrics like lexical diversity, sentence variety, speech rate, and articulation rate.



### **Challenges Faced and Solutions**

#### **Challenge 1: Deepgram API Issues**
- **Problem**: The Deepgram API was inconsistent—some methods were unreliable and intermittently failed.
- **Solution**: Adopted a simpler and more robust approach using the browser's native `SpeechRecognition` API. Enhanced this by:
  - Adding punctuation logic based on silence durations.
  - Tracking pauses to evaluate fluency.

#### **Challenge 2: Integration with Google APIs**
- **Problem**: Configuring and integrating the Google Natural Language and Generative AI APIs required careful management of tokens, requests, and responses.
- **Solution**: Streamlined API requests with reusable methods and detailed error handling.

#### **Challenge 3: Scoring Complexity**
- **Problem**: Balancing logic-driven scores with AI-driven feedback for fluency and grammar.
- **Solution**: Implemented a hybrid scoring system:
  - Logic-based metrics (e.g., lexical diversity, filler words, pauses).
  - AI-enhanced feedback for nuanced assessments (e.g., pronunciation).



### **Key Features**

#### **Frontend**
1. **Speech Recognition**:
   - Real-time transcription with punctuation.
   - Tracks pauses and calculates effective speaking time.
2. **Dynamic Feedback**:
   - Displays AI feedback for pronunciation, grammar, and fluency.
3. **Test Mode**:
   - Allows users to complete parts of the IELTS test.
   - Submits responses and questions to the backend for scoring.

#### **Backend**
1. **Scoring Metrics**:
   - **Fluency**: Combines AI feedback with metrics like articulation rate and pause ratio.
   - **Grammar**: Penalizes unclassified words and rewards syntactically correct sentences.
   - **Vocabulary**: Rewards diverse and descriptive words.
   - **Pronunciation**: Uses AI to detect and suggest corrections for mispronunciations.
2. **Google Integration**:
   - Syntax analysis with Natural Language API.
   - Detailed, AI-driven feedback with Gemini.

---

### **How It All Works**
1. **Start Recording**: User begins recording via the frontend.
2. **Transcription**:
   - SpeechRecognition API captures audio.
   - Interim and final transcripts are displayed in real-time.
   - Pauses are tracked, and punctuation is added automatically.
3. **Feedback**:
   - Transcription is sent to the backend.
   - Backend analyzes the response, calculates scores, and generates suggestions.
4. **Results**:
   - Scores and feedback are displayed to the user.

