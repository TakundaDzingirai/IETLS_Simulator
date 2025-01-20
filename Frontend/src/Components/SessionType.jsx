import React, { useState, useRef } from "react";
import axios from "axios";
import IELTSPracticeTest from "./IELTSPracticeTest";
import RandomiseQuest from "./RandomiseQuest";
import FeedbackDisplay from "./FeedbackDisplay";
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
    const [testFeedback, setTestFeedback] = useState(null);

    const recognitionRef = useRef(null);
    const timeoutRef = useRef(null);
    const lastWordTimeRef = useRef(null);
    const startTimeRef = useRef(null);

    // *** NEW: Track total paused time
    const pauseTimeRef = useRef(0);

    // Send transcription to backend for feedback
    const sendFeedbackRequest = async (finalTranscript) => {
        try {
            const response = await axios.post(
                "http://localhost:5000/api/practice/feedback",
                {
                    response: finalTranscript,
                    original: original || "n/a",
                    // Pass both total duration and total paused time
                    timingData: {
                        duration: getDuration(),
                        pauseDuration: pauseTimeRef.current
                    },
                }
            );
            console.log(response.data.feedback);
            setFeedback(response.data.feedback);
        } catch (error) {
            console.error("Error sending transcription to backend:", error);
            setFeedback("Failed to retrieve feedback. Please try again.");
        }
    };

    const getDuration = () => {
        const endTime = new Date();
        return startTimeRef.current ? (endTime - startTimeRef.current) / 1000 : 0; // Duration in seconds
    };

    const submitTestResponses = async () => {
        console.log(testResponses)
        try {
            const response = await axios.post("http://localhost:5000/api/test/submit", {
                responses: testResponses,
                timingData: {}, // pass data if needed
            });
            console.log("Test feedback received:", response.data.feedback);
            setTestFeedback(response.data.feedback);
        } catch (error) {
            console.error("Error submitting test:", error);
            setFeedback("Failed to submit test. Please try again.");
        }
    };

    const handleStartRecording = () => {
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }

        // Stop any previous recognition instance
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        // Start timers
        startTimeRef.current = new Date();
        lastWordTimeRef.current = new Date();

        // *** NEW: reset paused time at start
        pauseTimeRef.current = 0;

        recognition.onstart = () => {
            setIsRecording(true);
            setTranscription("");
            console.log("Recording started...");
        };

        recognition.onresult = (event) => {
            // Grab only the newest result
            const lastResult = event.results[event.results.length - 1];
            const transcript = lastResult[0].transcript.trim();

            if (lastResult.isFinal) {
                console.log("infinal state");
                clearTimeout(timeoutRef.current);

                const now = new Date();
                const timeDiff = (now - lastWordTimeRef.current) / 1000;

                // Simple pause-based punctuation
                const punctuation =
                    timeDiff > 1.5 ? "." : timeDiff > 0.8 ? "," : "";

                // Append only the new final chunk
                setTranscription((prev) => `${prev.trim()}${punctuation} ${transcript}`);
                lastWordTimeRef.current = now;
            }

            // Handle the punctuation on a timeout if user goes silent for 1.5s
            timeoutRef.current = setTimeout(() => {
                const now = new Date();
                const timeDiff = (now - lastWordTimeRef.current) / 1000;

                if (timeDiff > 1.5) {
                    // *** NEW: add to paused time
                    pauseTimeRef.current += timeDiff;

                    setTranscription((prev) => `${prev.trim()}. `);
                    lastWordTimeRef.current = now;
                }
            }, 1500);
        };

        recognition.onend = () => {
            console.log("Recording stopped.");
            setIsRecording(false);
            clearTimeout(timeoutRef.current);
        };

        recognition.onerror = (event) => {
            console.error("Error during speech recognition:", event.error);
            setIsRecording(false);
        };

        recognition.start();
        recognitionRef.current = recognition;
    };

    const handleStopRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }

        if (sessionType === "practice") {
            sendFeedbackRequest(transcription);
        } else {
            // For test mode
            const updateTestResponse = (part) => {
                setTestResponses((prev) => ({
                    ...prev,
                    [part]: [
                        ...prev[part],        // keep any existing objects in that part
                        {
                            response: transcription,  // the user’s spoken answer
                            questions: original       // the full question text
                        }
                    ],
                }));
            };

            if (currentPart === 1) {
                updateTestResponse("part1");
            } else if (currentPart === 2) {
                updateTestResponse("part2");
            } else if (currentPart === 3) {
                updateTestResponse("part3");
            }

            setCurrentPart((prevPart) => Math.min(prevPart + 1, 4));
        }

        setIsRecording(false);
    };
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
                    <IELTSPracticeTest setOriginal={setOriginal} />
                </div>
            )}
            {testFeedback && (
                <FeedbackDisplay feedback={testFeedback} />
            )}



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
            <button onClick={onBack} style={buttonStyle}>
                Back to Selection
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
