//Jake Shrimtpon - Home page 
import { useState } from 'react';
import { Button } from '@mui/material';

import URLForm from '../components/common/form';
import PhishingChart from '../components/common/confidence_chart'

function Home() {
 const [result, setResult] = useState(null);
    const [showForm, setShowForm] = useState(true);

    const handleResult = (data) => {
        setResult(data);
        setShowForm(false);
    };

    const handleCheckAnother = () => {
        setShowForm(true);
    };

    return (
        <div className="App-header">
            <h1>PHISHING URL DETECTION SYSTEM</h1>

            <div>
                <h2>Analysis Result</h2>
            </div>

            {/* Component for result visualisation */}
            <PhishingChart result={result} />

            {/* Show form before analysis, or button after analysis */}
            {showForm ? (
                <URLForm Result={handleResult} />
            ) : (
            <Button variant="contained" onClick={handleCheckAnother}>
              Check another
            </Button>
            )}

        </div>
  );
}

export default Home;
