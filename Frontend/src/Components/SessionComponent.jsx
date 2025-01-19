import React, { useState } from "react";
import { createClient } from "@deepgram/sdk";
import SentenceReader from "./RandomiseQuest";
import axios from "axios";
const deepgramApiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;

const SessionComponent = ({ sessionType, onBack }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [microphone, setMicrophone] = useState(null);
  const [socket, setSocket] = useState(null);
  const [aiFeedback, setFeedback] = useState(null); // Set to null initially
  const [original, setOriginal] = useState("")

  // Initialize Deepgram SDK


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
        original: original ? original : "n/a", // Reference sentence for comparison
        timingData: {}, // Include timing data if applicable
      });

      // Extract data from response
      const { analysis, scores, corrections, feedback, suggestions } = response.data.feedback;
      // console.log(`Analysis:${analysis}`);
      // console.log(`Scores:${scores}`);
      // console.log(`Corrections:${corrections[0]}`);
      // console.log(`Feedback:${feedback}}`);
      // console.log(`Suggetions:${suggestions}`);
      const feed = response.data.feedback;


      setFeedback(feed);

      console.log("Feedback received:", feed);
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
      {(sessionType === "practice") && (<SentenceReader setOriginal={setOriginal} />)}
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
            <>
              {/* Display Scores */}
              <div style={{ marginBottom: "20px" }}>
                <h4>Scores</h4>
                <p>Fluency: {aiFeedback.scores?.fluency || "N/A"}</p>
                <p>Grammar: {aiFeedback.scores?.grammar || "N/A"}</p>
                <p>Vocabulary: {aiFeedback.scores?.vocabulary || "N/A"}</p>
                <p>Pronunciation: {aiFeedback.scores?.pronunciation || "N/A"}</p>
              </div>

              {/* Display Corrections */}
              <div>
                <h4>Corrections</h4>
                {aiFeedback.suggestions[0]}
                {aiFeedback.corrections?.map((correction, index) => (
                  <div key={index} style={{ marginBottom: "10px" }}>
                    {correction.AI?.split("\n").map((line, lineIndex) => (
                      <React.Fragment key={lineIndex}>
                        {line}
                        <br />
                      </React.Fragment>
                    ))}
                  </div>
                ))}
              </div>
            </>
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
