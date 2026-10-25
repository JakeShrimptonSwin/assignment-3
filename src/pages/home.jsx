//Jake Shrimtpon - Home page 
import { useState } from 'react';
import URLForm from '../components/common/form';

function Home() {
  const [result, setResult] = useState(null);

  return (
    <div className="App-header">
      <h1>PHISHING URL DETECTION</h1>

      {result && (
        <div>
          <h2>Analysis Result</h2>
          <p>
            This URL was classified as{' '}
            <strong>{result.prediction === 'phishing' ? 'PHISHING' : 'BENIGN'}</strong>.
          </p>
          <p>Confidence: {(result.confidence * 100).toFixed(1)}%</p>
          <p>Phishing probability: {(result.phishing_probability * 100).toFixed(1)}%</p>
        </div>
      )}

      <URLForm Result={setResult} />
    </div>
  );
}

export default Home;
