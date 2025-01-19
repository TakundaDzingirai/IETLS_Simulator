import React, { useState, useEffect } from "react";
import axios from "axios";

const IELTSPracticeTest = ({ setSection }) => {
  const [testQuestions, setTestQuestions] = useState(null);
  const [currentPart, setCurrentPart] = useState(1); // To track which part is being displayed

  // Fetch test questions when the component loads
  useEffect(() => {
    const fetchTestQuestions = async () => {
      try {
        const response = await axios.post("http://localhost:5000/api/test/start"); // Adjust your API URL if needed
        setTestQuestions(response.data.testQuestions);
      } catch (error) {
        console.error("Error fetching test questions:", error.message);
      }
    };

    fetchTestQuestions();
  }, []);

  // Function to render the current part
  const renderCurrentPart = () => {
    if (!testQuestions) {
      return <p>Loading test questions...</p>;
    }

    switch (currentPart) {
      case 1: // Part 1: Introduction
        return (
          <div>
            <h3>Part 1: Introduction</h3>
            <ul>
              {testQuestions.part1.map((question, index) => (
                <li key={index}>{question}</li>
              ))}
            </ul>
            <button onClick={() => setCurrentPart(2)}>Next: Cue Card</button>
          </div>
        );
      case 2: // Part 2: Cue Card Activity
        return (
          <div>
            <h3>Part 2: Cue Card</h3>
            <p><strong>{testQuestions.part2.topic}</strong></p> {/* Display the topic */}
            <ul>
              {testQuestions.part2.prompts.map((prompt, index) => (
                <li key={index}>{prompt}</li> // Display each prompt
              ))}
            </ul>
            <button onClick={() => setCurrentPart(3)}>Next: Two-Way Discussion</button>
          </div>
        );
      case 3: // Part 3: Two-Way Discussion
        return (
          <div>
            <h3>Part 3: Two-Way Discussion</h3>
            <ul>
              {testQuestions.part3.map((question, index) => (
                <li key={index}>{question}</li>
              ))}
            </ul>
            <button onClick={() => setCurrentPart(1)}>Restart Test</button>
          </div>
        );
      default:
        return <p>Invalid part.</p>;
    }
  };

  return (
    <div>
      <h2>IELTS Speaking Test</h2>
      {renderCurrentPart()}
    </div>
  );
};

export default IELTSPracticeTest;
