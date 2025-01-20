import React, { useState } from 'react';
import SessionComponent from './Components/SessionComponent';
import SessionType from './Components/SessionType';

const App = () => {
  const [sessionType, setSessionType] = useState(null);

  const handleSessionSelection = (type) => {
    setSessionType(type);
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>IELTS Speaking Test Simulator</h1>
        {!sessionType ? (
          <div style={centerContentStyle}>
            <h2>Select Session Type</h2>
            <button onClick={() => handleSessionSelection('practice')} style={buttonStyle}>
              Practice Mode
            </button>
            <button onClick={() => handleSessionSelection('test')} style={buttonStyle}>
              Test Mode
            </button>
          </div>
        ) : (
          <div style={centerComponentStyle}>
            <SessionType sessionType={sessionType} onBack={() => setSessionType(null)} />
          </div>
        )}
      </div>
    </div>
  );
};

// Styles for the container (full page)
const containerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh', // Full height of the viewport
  backgroundColor: '#f4f4f9', // Light gray background
  padding: '20px',
  textAlign: 'center', // Ensures text is centered inside the card
};

// Styles for the card
const cardStyle = {
  backgroundColor: '#fff', // White background for the card
  padding: '30px 40px', // Add padding inside the card
  borderRadius: '10px', // Rounded corners
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // Subtle shadow for the card
  maxWidth: '600px', // Limit the card's width
  width: '100%', // Ensure responsiveness
  display: 'flex',
  flexDirection: 'column', // Stack child elements vertically
  alignItems: 'center', // Center child elements horizontally
};

// Title styling
const titleStyle = {
  marginBottom: '20px',
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
};

// Center the initial buttons and content
const centerContentStyle = {
  textAlign: 'center',
};

// Center rendered components (like SessionType)
const centerComponentStyle = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
};

// Button styling
const buttonStyle = {
  padding: '10px 20px',
  margin: '10px',
  backgroundColor: '#007BFF', // Primary button color
  color: '#fff',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '16px',
  transition: 'background-color 0.3s',
};

// Add hover effect for the buttons
buttonStyle[':hover'] = {
  backgroundColor: '#0056b3',
};

export default App;
