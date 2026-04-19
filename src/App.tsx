import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import BuildPage from './BuildPage';
import ResultsPage from './ResultsPage';

const App = () => {
    const [results, setResults] = useState(null);

    const handleCompletion = (data) => {
        setResults(data);
        // navigate to ResultsPage ...<YOUR_NAVIGATION_LOGIC>
    };

    return (
        <Router>
            <Switch>
                <Route path="/build">
                    <BuildPage onComplete={handleCompletion} />
                </Route>
                <Route path="/results">
                    {results ? <ResultsPage data={results} /> : <Redirect to="/build" />}
                </Route>
                <Redirect from="/" to="/build" />
            </Switch>
        </Router>
    );
};

export default App;