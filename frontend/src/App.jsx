import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CreatePoll from './pages/CreatePoll';
import VotePoll from './pages/VotePoll';
import Results from './pages/Results';
import { ToastProvider } from './components/Toast';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Navbar />
          <div className="container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/create" element={<CreatePoll />} />
              <Route path="/poll/:id" element={<VotePoll />} />
              <Route path="/poll/:id/results" element={<Results />} />
            </Routes>
          </div>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
