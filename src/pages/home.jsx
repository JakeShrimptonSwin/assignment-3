//Jake Shrimtpon - Home page 
import { useState } from 'react';
import URLForm from '../components/common/form';

import PhishingChart from '../components/common/confidence_chart'

function Home() {
  const [result, setResult] = useState(null);

  return (
    <div className="App-header">
      <h1>PHISHING URL DETECTION</h1>
        <div>
          <h2>Analysis Result</h2>
        </div>

      {/* component for result vis */}
      <PhishingChart result={result} />
      
      {/* component for entry form */}
      <URLForm Result={setResult} />

    </div>
  );
}

export default Home;
