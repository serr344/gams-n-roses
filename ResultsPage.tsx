import React from 'react';
import ResultScreen from './ResultScreen';

const ResultsPage = ({ optimalSpeakerCount, GAMSPyProbability, similarityPercentage }) => {
    return (
        <div>
            <h1>Results Page</h1>
            <ResultScreen 
                optimalSpeakerCount={optimalSpeakerCount} 
                GAMSPyProbability={GAMSPyProbability} 
                similarityPercentage={similarityPercentage} 
            />
        </div>
    );
};

export default ResultsPage;