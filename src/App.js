//Jake Shrimpton - This page will act as the front facing page.
//

import './App.css';
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink
} from 'react-router-dom';

import Home from './pages/home';
import DataPage from './pages/data_page';
import HistoryPage from './pages/history_page';

function App() {
  return (
    <BrowserRouter>
      <nav className="navbar">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/dataGraph">Data Graph</NavLink>
        <NavLink to="/history">History</NavLink>
      </nav>

      <main className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dataGraph" element={<DataPage />} />
          <Route path="/history" element={<HistoryPage />}/>
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
