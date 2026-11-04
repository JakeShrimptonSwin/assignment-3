//Jake Shrimpton
//This page will show a history of previous searches ? 

import { useState } from 'react';
import { Button } from '@mui/material';

import HistoryList from '../components/common/history_list';
import { getHistory, removeFromHistory, clearHistory } from '../utils/history';

function HistoryPage() {
  const [history, setHistory] = useState(getHistory());

  const handleDelete = (id) => setHistory(removeFromHistory(id));

  const handleClear = () => {
    clearHistory();
    setHistory([]);
  };

  return (
    <div className="App-header">
      <h1>History</h1>

      {history.length === 0 ? (
        <p>No checks yet. Analyse a URL on the home page and it will appear here.</p>
      ) : (
        <>
          <HistoryList history={history} onDelete={handleDelete} />
          <Button variant="outlined" color="error" onClick={handleClear}>
            Clear history
          </Button>
        </>
      )}
    </div>
  );
}

export default HistoryPage;