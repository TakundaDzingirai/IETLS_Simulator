// SessionComponent Implementation
import React, { useState } from 'react';

const SessionComponent = ({ sessionType, onBack }) => {
  const [transcription, setTranscription] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleTranscriptionUpdate = (newTranscription) => {
    setTranscription(newTranscription);
  };

  const handleFeedbackUpdate = (newFeedback) => {
    setFeedback(newFeedback);
  };

  return (
    <div>
      <h2>{sessionType === 'practice' ? 'Practice Mode' : 'Test Mode'}</h2>
      <button onClick={onBack} style={buttonStyle}>Back to Selection</button>

      <div style={{ marginTop: '20px' }}>
        <h3>Real-Time Transcription</h3>
        <div style={transcriptionBoxStyle}>{transcription || 'Transcription will appear here...'}</div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Feedback</h3>
        <div style={feedbackBoxStyle}>{feedback || 'Feedback will appear here...'}</div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button style={buttonStyle} onClick={() => handleTranscriptionUpdate('Example transcription.')}>Simulate Transcription</button>
        <button style={buttonStyle} onClick={() => handleFeedbackUpdate('Great pronunciation and coherence!')}>
          Simulate Feedback
        </button>
      </div>
    </div>
  );
};

const buttonStyle = {
  padding: '10px 20px',
  margin: '5px',
  backgroundColor: '#007BFF',
  color: '#fff',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
};

const transcriptionBoxStyle = {
  border: '1px solid #ccc',
  borderRadius: '5px',
  padding: '10px',
  minHeight: '50px',
  backgroundColor: '#f9f9f9',
};

const feedbackBoxStyle = {
  border: '1px solid #ccc',
  borderRadius: '5px',
  padding: '10px',
  minHeight: '50px',
  backgroundColor: '#e9f7ef',
};

export default SessionComponent;
