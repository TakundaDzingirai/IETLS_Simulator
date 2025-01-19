import React, { useState } from "react";

// Example array of sentences
const sentenceArray = [
    // Beginner-level sentences
    { level: "Beginner", sentences: ["The cat sat on the mat."] },
    { level: "Beginner", sentences: ["I like apples."] },
    { level: "Beginner", sentences: ["It is a sunny day."] },
    { level: "Beginner", sentences: ["The dog is barking."] },
    { level: "Beginner", sentences: ["She has a red hat."] },

    // Intermediate-level sentences
    { level: "Intermediate", sentences: ["The flowers in the garden are blooming beautifully."] },
    { level: "Intermediate", sentences: ["The little boy ran quickly to catch the ball."] },
    { level: "Intermediate", sentences: ["He enjoys playing chess on weekends."] },
    { level: "Intermediate", sentences: ["She decided to bake a chocolate cake for her friend's birthday."] },
    { level: "Intermediate", sentences: ["The students were excited about their upcoming field trip."] },

    // Advanced-level sentences
    { level: "Advanced", sentences: ["Although the weather forecast predicted rain, the sky remained clear."] },
    { level: "Advanced", sentences: ["The intricacies of quantum physics often baffle even the brightest minds."] },
    { level: "Advanced", sentences: ["In a world teeming with diversity, it is imperative to embrace inclusivity."] },
    { level: "Advanced", sentences: ["The symphony of nature's sounds created a harmonious atmosphere."] },
    { level: "Advanced", sentences: ["Her eloquent speech captivated the audience, leaving them in awe."] },

    // Mixed (longer sentences for fluency)
    { level: "Mixed", sentences: ["The girl who lives next door often reads books about space and astronomy."] },
    { level: "Mixed", sentences: ["Despite his initial reluctance, he eventually agreed to join the team for the project."] },
    { level: "Mixed", sentences: ["As the sun set over the horizon, the sky turned a vibrant shade of orange and pink."] },
    { level: "Mixed", sentences: ["Walking through the dense forest, he marveled at the towering trees and chirping birds."] },
    { level: "Mixed", sentences: ["The artist spent hours perfecting every detail of her masterpiece."] },

    // Advanced fluency-focused sentences
    { level: "Fluency", sentences: ["With great perseverance, he meticulously crafted the intricate sculpture from marble."] },
    { level: "Fluency", sentences: ["The phenomenon of photosynthesis is crucial for the sustenance of life on Earth."] },
    { level: "Fluency", sentences: ["As the debate intensified, both sides presented compelling arguments to support their claims."] },
    { level: "Fluency", sentences: ["The juxtaposition of tradition and modernity creates a unique cultural identity."] },
    { level: "Fluency", sentences: ["Despite their differences, the team worked collaboratively to achieve their goal."] },
];

const RandomiseQuest = ({ setOriginal }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Function to go to the next sentence
    const nextSentence = () => {
        if (currentIndex < sentenceArray.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    // Function to go to the previous sentence
    const previousSentence = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    // Get the current sentence object
    const currentSentence = sentenceArray[currentIndex];
    setOriginal(currentSentence.sentences[0]);

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h2>Read Aloud Practice</h2>
            <div style={{ marginBottom: "20px" }}>
                <h4>Level: {currentSentence.level}</h4>
                <p>
                    {currentSentence.sentences.map((sentence, index) => (
                        <span key={index} style={{ display: "block", marginBottom: "10px" }}>
                            {sentence}
                        </span>
                    ))}
                </p>
            </div>
            <div>
                <button
                    onClick={previousSentence}
                    disabled={currentIndex === 0}
                    style={{
                        padding: "10px 20px",
                        marginRight: "10px",
                        backgroundColor: "#007BFF",
                        color: "#fff",
                        border: "none",
                        borderRadius: "5px",
                        cursor: currentIndex === 0 ? "not-allowed" : "pointer",
                    }}
                >
                    Previous
                </button>
                <button
                    onClick={nextSentence}
                    disabled={currentIndex === sentenceArray.length - 1}
                    style={{
                        padding: "10px 20px",
                        backgroundColor: "#28A745",
                        color: "#fff",
                        border: "none",
                        borderRadius: "5px",
                        cursor: currentIndex === sentenceArray.length - 1 ? "not-allowed" : "pointer",
                    }}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default RandomiseQuest;
