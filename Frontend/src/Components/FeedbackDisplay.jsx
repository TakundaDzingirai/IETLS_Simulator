import React from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";

function FeedbackDisplay({ feedback }) {
  // feedback structure:
  // {
  //   part1: [ { part: 'part1', scores: {...}, suggestions: [...], ... }, ... ],
  //   part2: [ { part: 'part2', scores: {...}, ... }, ... ],
  //   part3: [ { part: 'part3', scores: {...}, ... }, ... ]
  // }

  const handleDownloadPDF = () => {
    // 1) Create a new jsPDF instance
    const doc = new jsPDF({
      // orientation: 'portrait',
      // unit: 'pt',
      // format: 'A4',
    });

    // 2) Add a title
    doc.setFontSize(16);
    doc.text("IELTS Test Results", 14, 20);

    let yPos = 30; // vertical offset

    // 3) Loop over each part (part1, part2, part3)
    Object.entries(feedback).forEach(([partName, partResults]) => {
      // partName is "part1", "part2", "part3"
      // partResults is an array of results

      doc.setFontSize(14);
      doc.text(partName.toUpperCase(), 14, yPos);
      yPos += 10;

      // 4) For each result in this part
      partResults.forEach((result, index) => {
        // e.g. result.scores, result.suggestions, result.corrections, etc.
        // Make sure we handle page breaks if needed
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(12);
        doc.text(`Response #${index + 1}`, 14, yPos);
        yPos += 8;

        // Scores
        if (result.scores) {
          doc.text(`Fluency: ${result.scores.fluency}`, 14, yPos);
          yPos += 6;
          doc.text(`Grammar: ${result.scores.grammar}`, 14, yPos);
          yPos += 6;
          doc.text(`Vocabulary: ${result.scores.vocabulary}`, 14, yPos);
          yPos += 6;
          doc.text(`Pronunciation: ${result.scores.pronunciation}`, 14, yPos);
          yPos += 8;
        }

        // Suggestions (if array)
        if (Array.isArray(result.suggestions)) {
          result.suggestions.forEach((suggestion) => {
            // We'll just split the text into lines
            const lines = doc.splitTextToSize(suggestion, 180);
            lines.forEach((line) => {
              doc.text(line, 14, yPos);
              yPos += 6;
              if (yPos > 270) {
                doc.addPage();
                yPos = 20;
              }
            });
            yPos += 6;
          });
        }

        // Corrections (if array)
        if (Array.isArray(result.corrections)) {
          doc.text("Corrections:", 14, yPos);
          yPos += 6;
          result.corrections.forEach((corr) => {
            const lines = doc.splitTextToSize(corr.AI, 180);
            lines.forEach((line) => {
              doc.text(line, 14, yPos);
              yPos += 6;
              if (yPos > 270) {
                doc.addPage();
                yPos = 20;
              }
            });
            yPos += 6;
          });
        }

        // (Optional) If there's more data like `analysis` or `feedback`, you can similarly add them
      });

      yPos += 10;
    });

    // 5) Finally, save the PDF
    doc.save("IELTS_Test_Results.pdf");
  };

  // Render the feedback in your UI + a Download button
  return (
    <div>
      <h3>Test Results</h3>

      {/* Render the feedback in your UI as normal... */}
      {Object.entries(feedback).map(([part, partData], idx) => (
        <div key={idx} style={{ marginBottom: "20px" }}>
          <h4>{part.toUpperCase()}</h4>
          {partData.map((item, i) => (
            <div key={i}>
              <p>Fluency: {item.scores?.fluency}</p>
              <p>Grammar: {item.scores?.grammar}</p>
              <p>Vocabulary: {item.scores?.vocabulary}</p>
              <p>Pronunciation: {item.scores?.pronunciation}</p>
              {/* ...and so on... */}
            </div>
          ))}
        </div>
      ))}

      {/* Button to download PDF */}
      <button onClick={handleDownloadPDF}>Download PDF</button>
    </div>
  );
}

export default FeedbackDisplay;
