import React, { useState, useRef } from "react";
import axios from "axios";
import IELTSPracticeTest from "./IELTSPracticeTest";
import RandomiseQuest from "./RandomiseQuest";

const SessionType = ({ sessionType, onBack }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcription, setTranscription] = useState("");
    const [aiFeedback, setFeedback] = useState(null);
    const [original, setOriginal] = useState("");
    const [currentPart, setCurrentPart] = useState(1);
    const [testResponses, setTestResponses] = useState({
        part1: [],
        part2: [],
        part3: [],
    });

    const recognitionRef = useRef(null); // Reference to the SpeechRecognition instance

    // Send transcription to backend for feedback
    const sendFeedbackRequest = async (finalTranscript) => {
        try {
            const response = await axios.post(
                "http://localhost:5000/api/practice/feedback",
                {
                    response: finalTranscript,
                    original: original || "n/a",
                    timingData: {},
                }
            );
            console.log(response.data.feedback);
            setFeedback(response.data.feedback);
        } catch (error) {
            console.error("Error sending transcription to backend:", error);
            setFeedback("Failed to retrieve feedback. Please try again.");
        }
    };

    // Submit test responses
    const submitTestResponses = async () => {
        try {
            const response = await axios.post("http://localhost:5000/api/test/submit", {
                responses: testResponses,
                timingData: {},
            });
            console.log("Test feedback received:", response.data.feedback);
        } catch (error) {
            console.error("Error submitting test:", error);
            setFeedback("Failed to submit test. Please try again.");
        }
    };

    // Start recording using SpeechRecognition API
    const handleStartRecording = () => {
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }

        if (recognitionRef.current) {
            console.warn("Recognition instance already exists. Stopping it first...");
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
            setIsRecording(true);
            setTranscription("");
            console.log("Recording started...");
        };

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map((result) => result[0].transcript)
                .join(" ");
            setTranscription(transcript);
        };

        recognition.onend = () => {
            console.log("Recording stopped.");
            setIsRecording(false);
        };

        recognition.onerror = (event) => {
            console.error("Error during speech recognition:", event.error);
            setIsRecording(false);
        };

        recognition.start();
        recognitionRef.current = recognition; // Store the instance in the ref
    };

    // Stop recording and turn off mic
    const handleStopRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null; // Clear the reference
        }

        if (sessionType === "practice") {
            sendFeedbackRequest(transcription);
        } else {
            const updateTestResponse = (part) => {
                setTestResponses((prev) => ({
                    ...prev,
                    [part]: [...prev[part], transcription],
                }));
            };

            if (currentPart === 1) updateTestResponse("part1");
            else if (currentPart === 2) updateTestResponse("part2");
            else if (currentPart === 3) updateTestResponse("part3");

            setCurrentPart((prevPart) => Math.min(prevPart + 1, 3));
        }

        setIsRecording(false);
    };

    // Clear transcription and feedback
    const handleClear = () => {
        setTranscription("");
        setFeedback(null);
        setOriginal("");
    };

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

export default SessionType;
