// Refactored React UI Setup for IELTS Speaking Test
import React, { useState } from 'react';
import SessionComponent from './Components/SessionComponent';

const App = () => {
  const [sessionType, setSessionType] = useState(null);

  const handleSessionSelection = (type) => {
    setSessionType(type);
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <h1>IELTS Speaking Test Simulator</h1>
      {!sessionType ? (
        <div>
          <h2>Select Session Type</h2>
          <button onClick={() => handleSessionSelection('practice')} style={buttonStyle}>Practice Mode</button>
          <button onClick={() => handleSessionSelection('test')} style={buttonStyle}>Test Mode</button>
        </div>
      ) : (
        <SessionComponent sessionType={sessionType} onBack={() => setSessionType(null)} />
      )}
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

export default App;
