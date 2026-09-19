import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PollCard from '../components/PollCard';
import api from '../services/api';
import './Home.css';

const Home = () => {
  const { isAuthenticated, loading } = useAuth();
  const [myPolls, setMyPolls] = useState([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setFetching(true);
      api.get('/api/polls')
        .then(data => {
          // If API returns an array directly or wraps it
          setMyPolls(Array.isArray(data) ? data : (data.polls || []));
        })
        .catch(err => console.error(err))
        .finally(() => setFetching(false));
    }
  }, [isAuthenticated]);

  return (
    <div className="home-container">
      <section className="hero-section">
        <h1 className="hero-title gradient-text">Real-Time Polling, Reimagined</h1>
        <p className="hero-subtitle">
          Create beautiful, secure, and instant live polls to engage your audience. 
          Watch results update in real-time as votes come in.
        </p>
        <div className="hero-actions">
          <Link to="/create" className="btn btn-primary">Create a Poll</Link>
          <a href="#features" className="btn btn-outline">How it Works</a>
        </div>
      </section>

      <section id="features" className="features-section">
        <div className="glass-card feature-card">
          <div className="feature-icon">⚡</div>
          <h3>Real-Time Results</h3>
          <p>Watch votes stream in instantly via WebSockets with no page refreshes required.</p>
        </div>
        <div className="glass-card feature-card">
          <div className="feature-icon">🔒</div>
          <h3>Secure Voting</h3>
          <p>Advanced anti-cheat mechanisms ensure one vote per person to maintain poll integrity.</p>
        </div>
        <div className="glass-card feature-card">
          <div className="feature-icon">📊</div>
          <h3>Live Analytics</h3>
          <p>Beautiful animated charts and statistics help you understand your audience immediately.</p>
        </div>
        <div className="glass-card feature-card">
          <div className="feature-icon">🔗</div>
          <h3>Easy Sharing</h3>
          <p>Share your poll with a simple link or QR code. No account required for voters.</p>
        </div>
      </section>

      {isAuthenticated && !loading && (
        <section className="my-polls-section">
          <h2 className="section-title">My Polls</h2>
          {fetching ? (
            <div className="loading-container"><div className="spinner"></div></div>
          ) : myPolls.length > 0 ? (
            <div className="polls-grid">
              {myPolls.map(poll => (
                <PollCard key={poll.id} poll={poll} />
              ))}
            </div>
          ) : (
            <div className="glass-card empty-state">
              <p>You haven't created any polls yet.</p>
              <Link to="/create" className="btn btn-primary" style={{ marginTop: '16px' }}>
                Create Your First Poll
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Home;
