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
          <h2>Request Payload</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      <URLForm Result={setResult} />
    </div>
  );
}

export default Home;
