import React, { useState } from "react";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";  // Import LiveTranscriptionEvents
import IELTSPracticeTest from "./IELTSPracticeTest";
import axios from "axios";
import RandomiseQuest from "./RandomiseQuest";

const deepgramApiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
const deepgram = createClient(deepgramApiKey); // Initialize once at top level

const SessionComponent = ({ sessionType, onBack }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [microphone, setMicrophone] = useState(null);
  const [socket, setSocket] = useState(null);

  // For practice feedback
  const [aiFeedback, setFeedback] = useState(null);
  const [original, setOriginal] = useState("");

  // For test responses
  const [testResponses, setTestResponses] = useState({
    part1: [],
    part2: [],
    part3: [],
  });
  const [currentPart, setCurrentPart] = useState(1);

  // Count how many times we have recorded in practice mode
  const [recordCount, setRecordCount] = useState(0);

  // ==========================================================
  // 1. Helper function to get the microphone (MediaRecorder)
  // ==========================================================
  const getMicrophone = async () => {
    const userMedia = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = "audio/webm;codecs=opus";
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return new MediaRecorder(userMedia, { mimeType });
    } else {
      return new MediaRecorder(userMedia); // fallback
    }
  };

  // =============================================
  // 2. Send transcription to backend for feedback
  // =============================================
  const sendFeedbackRequest = async (finalTranscript) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/practice/feedback",
        {
          response: finalTranscript,
          original: original || "n/a",
          timingData: {}, // if you have any
        }
      );
      setFeedback(response.data.feedback);
    } catch (error) {
      console.error("Error sending transcription to backend:", error);
      setFeedback("Failed to retrieve feedback. Please try again.");
    }
  };

  // ==================================
  // 3. Submit all test responses
  // ==================================
  const submitTestResponses = async () => {
    try {
      console.log("Submitting test responses:", testResponses);
      const response = await axios.post("http://localhost:5000/api/test/submit", {
        responses: testResponses,
        timingData: {},
      });
      console.log("Test feedback received:", response.data.feedback);
      // setFeedback(response.data.feedback) if you want
    } catch (error) {
      console.error("Error submitting test:", error);
      setFeedback("Failed to submit test. Please try again.");
    }
  };

  // ===================================
  // 4. Start Recording
  // ===================================
  const handleStartRecording = async () => {
    try {
      if (socket) {
        console.log("Closing previous WebSocket...");
        socket.requestClose();
      }

      console.log("Connecting to Deepgram WebSocket...");
      const dgSocket = deepgram.listen.live({ model: "nova", punctuate: true });

      let tempTranscription = "";

      // Using LiveTranscriptionEvents for event listeners
      dgSocket.on(LiveTranscriptionEvents.Open, () =>
        console.log("Connected to Deepgram WebSocket")
      );

      dgSocket.on(LiveTranscriptionEvents.Transcript, (data) => {
        if (data.channel && data.channel.alternatives?.length > 0) {
          const transcript = data.channel.alternatives[0]?.transcript || "";
          if (transcript) {
            console.log("Transcript:", transcript);
            tempTranscription += ` ${transcript}`;
            // Optionally update real-time transcription display
            setTranscription((prev) => prev + " " + transcript);
          }
        }
      });

      dgSocket.on(LiveTranscriptionEvents.Error, (error) =>
        console.error("Deepgram WebSocket error:", error)
      );

      setSocket(dgSocket);

      const mic = await getMicrophone();
      setMicrophone(mic);

      mic.ondataavailable = (e) => {
        if (e.data.size > 0) dgSocket.send(e.data);
      };

      mic.onstart = () => setIsRecording(true);

      mic.onstop = async () => {
        console.log("Microphone stopped");
        setIsRecording(false);

        const finalTranscript = tempTranscription.trim();
        console.log("Final Transcript:", finalTranscript);

        if (sessionType === "practice") {
          await sendFeedbackRequest(finalTranscript);
        } else {
          if (currentPart === 1) {
            setTestResponses((prev) => ({
              ...prev,
              part1: [...prev.part1, finalTranscript],
            }));
          } else if (currentPart === 2) {
            setTestResponses((prev) => ({
              ...prev,
              part2: [...prev.part2, finalTranscript],
            }));
          } else if (currentPart === 3) {
            setTestResponses((prev) => ({
              ...prev,
              part3: [...prev.part3, finalTranscript],
            }));
          }

          // Increment currentPart up to 3
          setCurrentPart((prevPart) => Math.min(prevPart + 1, 3));

          if (currentPart === 3) {
            dgSocket.requestClose();
          }
        } tempTranscription = ""; // Reset for the next recording
      };

      mic.start(500);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  // ===================================
  // 5. Stop Recording
  // ===================================
  const handleStopRecording = () => {
    if (microphone) {
      console.log("Stopping the microphone...");
      microphone.stop();
      setMicrophone(null);
    }
    if (socket) {
      console.log("Closing previous WebSocket...");
      socket.requestClose();
      setSocket(null);
    }
    // Socket closure after finalizing transcript is handled in mic.onstop()
  };

  // ===================================
  // 6. Clear everything
  // ===================================
  const handleClear = () => {
    setTranscription("");
    setFeedback(null);
    setOriginal("");
  };

  // Render UI
  return (
    <div>
      <h2>{sessionType === "practice" ? "Practice Mode" : "Test Mode"}</h2>

      {sessionType === "practice" && (
        <div>
          <p>You can display your practice sentence or use your SentenceReader here.</p>
          <RandomiseQuest setOriginal={setOriginal} />
        </div>
      )}
      {sessionType !== "practice" && (
        <div>
          <p>IELTSPracticeTest or other test instructions here.</p>
          <IELTSPracticeTest /* setSection={setSection} */ />
        </div>
      )}

      <button onClick={onBack} style={buttonStyle}>
        Back to Selection
      </button>

      <div style={{ marginTop: "20px" }}>
        <h3>Real-Time Transcription</h3>
        <div style={transcriptionBoxStyle}>
          {transcription || "Transcription will appear here..."}
        </div>
      </div>

      {sessionType === "practice" && (
        <div style={{ marginTop: "20px" }}>
          <h3>Feedback</h3>
          <div style={transcriptionBoxStyle}>
            {aiFeedback ? (
              <>
                {/* Scores */}
                <div style={{ marginBottom: "20px" }}>
                  <h4>Scores</h4>
                  <p>Fluency: {aiFeedback.scores?.fluency || "N/A"}</p>
                  <p>Grammar: {aiFeedback.scores?.grammar || "N/A"}</p>
                  <p>Vocabulary: {aiFeedback.scores?.vocabulary || "N/A"}</p>
                  <p>Pronunciation: {aiFeedback.scores?.pronunciation || "N/A"}</p>
                </div>
                {/* Corrections */}
                <div>
                  <h4>Corrections</h4>
                  {aiFeedback.suggestions?.[0]}
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
      )}

      {/* Recording Buttons */}
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

        {/* For test mode, once we've recorded for parts 1,2,3 => show Submit */}
        {sessionType !== "practice" && currentPart === 4 && (
          <button style={buttonStyle} onClick={submitTestResponses}>
            Submit Test
          </button>
        )}
      </div>

      <button style={buttonStyle} onClick={handleClear}>
        Clear
      </button>
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
