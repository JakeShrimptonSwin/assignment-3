//Jake Shrimpton - This page will act as the front facing page.
import './App.css';
import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom';

import Home from './pages/home';
import DataPage from './pages/data_page';
import HistoryPage from './pages/history_page';
import ErrorPage from './pages/error_page';
import LoginPage from "./pages/login_page";
import Navbar from './components/common/navbar';
import Footer from './components/common/footer';

function App() {
  
  return (
    <BrowserRouter>
      <Navbar />
      <main className="App">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/home" element={<Home/>}/>
          <Route path="/dataGraph" element={<DataPage />} />
          <Route path="/history" element={<HistoryPage />}/>
          <Route path="/login" element={<LoginPage />} />
           {/* Catch any unrecognised URL */}
          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </main>
      <Footer/>
    </BrowserRouter>
  );
}

export default App;
