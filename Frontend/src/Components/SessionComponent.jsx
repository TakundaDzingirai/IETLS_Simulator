import React, { useState } from "react";
import { createClient } from "@deepgram/sdk";
import axios from "axios";
const deepgramApiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;

const SessionComponent = ({ sessionType, onBack }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [microphone, setMicrophone] = useState(null);
  const [socket, setSocket] = useState(null);
  const [aiFeedback, setFeedback] = useState(null); // Set to null initially

  // Initialize Deepgram SDK

  console.log(deepgramApiKey);
  const deepgram = createClient(deepgramApiKey); // Replace with your API key

  const getMicrophone = async () => {
    const userMedia = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    const mimeType = "audio/webm;codecs=opus";
    if (MediaRecorder.isTypeSupported(mimeType)) {
      console.log(`Using MIME type: ${mimeType}`);
      return new MediaRecorder(userMedia, { mimeType });
    } else {
      console.warn(`MIME type ${mimeType} not supported, falling back to default.`);
      return new MediaRecorder(userMedia); // Fallback to default MIME type
    }
  };

  const sendFeedbackRequest = async (transcription) => {
    try {
      console.log("Sending transcription to backend...");
      const response = await axios.post("http://localhost:5000/api/practice/feedback", {
        response: transcription,
        original: "My name is Takunda", // Reference sentence for comparison
        timingData: {}, // Include timing data if applicable
      });
  
      // Extract data from response
      const { analysis, scores, corrections, feedback, suggestions } = response.data.feedback;
      console.log(response.data.feedback);
  
      // Format the AI feedback as a readable string
      const formattedFeedback = `
        **Feedback:**
        ${feedback}
  
        **Scores:**
        - Fluency: ${scores.fluency}/9
        - Grammar: ${scores.grammar}/9
        - Vocabulary: ${scores.vocabulary}/9
        - Pronunciation: ${scores.pronunciation}/9
  
        **Corrections:**
        ${corrections.length > 0 ? corrections.join("\n") : "No corrections needed."}
  
        **Suggestions:**
        ${suggestions.length > 0 ? suggestions.join("\n") : "No suggestions provided."}
  
        **Analysis:**
        ${analysis.tokens.map((token) => `Word: ${token.text}, Part of Speech: ${token.partOfSpeech}`).join("\n")}
      `;
  
      // Update feedback in the UI
      setFeedback(formattedFeedback);
  
      console.log("Feedback received:", response.data);
    } catch (error) {
      console.error("Error sending transcription to backend:", error.message);
      setFeedback("Failed to retrieve feedback. Please try again.");
    }
  };
  

  const handleStartRecording = async () => {
    try {
      console.log("Connecting to Deepgram WebSocket...");
      const dgSocket = deepgram.listen.live({ model: "nova", punctuate: true });
  
      // WebSocket Event Listeners
      dgSocket.on("open", () => {
        console.log("Connected to Deepgram WebSocket");
      });
    
      let tempTranscription = ""; // Temporary local variable for managing transcription

dgSocket.on("Results", (data) => {
  if (
    data.channel &&
    data.channel.alternatives &&
    data.channel.alternatives.length > 0
  ) {
    const transcript = data.channel.alternatives[0]?.transcript || "";

    if (transcript) {
      console.log(`Transcript: ${transcript}`);

      // Update React state for real-time transcription display
      setTranscription((prev) => `${prev} ${transcript}`); // Append new transcript

      // Append to the temporary transcription
      tempTranscription += ` ${transcript}`;

      // Handle final transcription
      if (data.is_final) {
        console.log("Final transcription:", tempTranscription.trim());

        // Send final transcription to the backend for feedback
        sendFeedbackRequest(tempTranscription.trim());
        tempTranscription = ""; // Reset temporary transcription after final result
      }
    }
  }
});

  
      dgSocket.on("error", (error) => {
        console.error("Deepgram WebSocket error:", error);
      });
  
      dgSocket.on("close", () => {
        console.log("Deepgram WebSocket closed");
      });
  
      setSocket(dgSocket);
  
      // Initialize microphone
      const mic = await getMicrophone();
      setMicrophone(mic);
  
      mic.ondataavailable = (e) => {
        if (e.data.size > 0) {
          console.log("Sending audio chunk to Deepgram...");
          dgSocket.send(e.data); // Send audio chunk to Deepgram WebSocket
        } else {
          console.warn("Received empty audio chunk");
        }
      };
  
      mic.onstart = () => {
        console.log("Microphone started...");
        setIsRecording(true);
      };
  
      mic.onstop = () => {
        console.log("Microphone stopped...");
        setIsRecording(false);
        dgSocket.requestClose();
       
      };
  
      mic.start(1000); // Send audio chunks every 1000ms
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };
  
  const handleStopRecording = () => {
    if (microphone) {
      console.log("Stopping recording...");
      microphone.stop();
      setMicrophone(null);
    }
    if (socket) {
      socket.requestClose();
      setSocket(null);
    }
  };
  
  return (
    <div>
      <h2>{sessionType === "practice" ? "Practice Mode" : "Test Mode"}</h2>
      <button onClick={onBack} style={buttonStyle}>
        Back to Selection
      </button>

      <div style={{ marginTop: "20px" }}>
        <h3>Real-Time Transcription</h3>
        <div style={transcriptionBoxStyle}>
          {transcription || "Transcription will appear here..."}
        </div>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h3>Feedback</h3>
        <div style={transcriptionBoxStyle}>
          {aiFeedback ? (
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {JSON.stringify(aiFeedback, null, 2)}
            </pre>
          ) : (
            "IELTS examiner feedback appears here..."
          )}
        </div>
      </div>

      <div style={{ marginTop: "20px" }}>
        {!isRecording ? (
          <button style={buttonStyle} onClick={handleStartRecording}>
            Start Recording
          </button>
        ) : (
          <button style={buttonStyle} onClick={handleStopRecording}>
            Stop Recording
          </button>
        )}
      </div>
    </div>
  );
};

const buttonStyle = {
  padding: "10px 20px",
  margin: "5px",
  backgroundColor: "#007BFF",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

const transcriptionBoxStyle = {
  border: "1px solid #ccc",
  borderRadius: "5px",
  padding: "10px",
  minHeight: "50px",
  backgroundColor: "#f9f9f9",
};

export default SessionComponent;
