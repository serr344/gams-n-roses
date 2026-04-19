import React from 'react';

const ResultScreen = ({ optimalSpeakerCount, GAMSPyProbability, similarityPercentage }) => {
    return (
        <div>
            <h1>Results</h1>
            <p>Optimal Speaker Count: {optimalSpeakerCount}</p>
            <p>GAMSPy Probability: {GAMSPyProbability}</p>
            <p>Similarity Percentage: {similarityPercentage}%</p>
        </div>
    );
};

export default ResultScreen;