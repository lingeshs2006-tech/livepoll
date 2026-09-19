import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../components/Toast';
import api from '../services/api';
import './VotePoll.css';

// Simple browser fingerprint generator
const generateFingerprint = () => {
  const nav = window.navigator;
  const screen = window.screen;
  const raw = [
    nav.userAgent,
    nav.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    nav.hardwareConcurrency || '',
  ].join('|');
  // Simple hash
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const chr = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return 'fp_' + Math.abs(hash).toString(36);
};

const VotePoll = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [voted, setVoted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const data = await api.get(`/api/polls/${id}`);
        setPoll(data);
      } catch (err) {
        setError(err.message || 'Failed to load poll');
      } finally {
        setLoading(false);
      }
    };
    fetchPoll();
  }, [id]);

  const toggleOption = (optionId) => {
    if (poll.allow_multiple) {
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(oid => oid !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleVote = async () => {
    if (selectedOptions.length === 0) return;

    setSubmitting(true);
    try {
      const fingerprint = generateFingerprint();

      // Handle single vote (current backend implementation)
      if (!poll.allow_multiple || selectedOptions.length === 1) {
        await api.post(`/api/polls/${id}/vote`, {
          option_id: selectedOptions[0],
          voter_fingerprint: fingerprint,
        });
      } else {
        // Handle multiple votes - send each vote separately
        for (const optionId of selectedOptions) {
          await api.post(`/api/polls/${id}/vote`, {
            option_id: optionId,
            voter_fingerprint: fingerprint,
          });
        }
      }

      setVoted(true);
      addToast('Vote cast successfully!', 'success');

      setTimeout(() => {
        navigate(`/poll/${id}/results`);
      }, 1500);

    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('already voted')) {
        addToast('You have already voted on this poll', 'error');
        setTimeout(() => navigate(`/poll/${id}/results`), 1000);
      } else {
        addToast(msg || 'Failed to cast vote', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="vote-container flex-center"><div className="spinner large"></div></div>;
  }

  if (error || !poll) {
    return (
      <div className="vote-container flex-center">
        <div className="glass-card error-card">
          <h2>Oops!</h2>
          <p>{error || 'Poll not found'}</p>
          <Link to="/" className="btn btn-primary mt-4">Go Home</Link>
        </div>
      </div>
    );
  }

  // Backend sends is_active boolean, not status string
  if (!poll.is_active) {
    return (
      <div className="vote-container flex-center">
        <div className="glass-card closed-card">
          <div className="closed-icon">🔒</div>
          <h2>This poll is closed</h2>
          <p>Voting is no longer allowed for this poll.</p>
          <Link to={`/poll/${id}/results`} className="btn btn-primary mt-4">View Results</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="vote-container">
      <div className="glass-card vote-card">
        {voted ? (
          <div className="success-state">
            <div className="check-icon">✓</div>
            <h2>Vote Cast!</h2>
            <p>Redirecting to results...</p>
          </div>
        ) : (
          <>
            <div className="vote-header">
              <span className="badge badge-active mb-2">Live</span>
              <h1 className="vote-title">{poll.title}</h1>
              {poll.description && <p className="vote-description">{poll.description}</p>}
              <p className="vote-instruction">
                {poll.allow_multiple ? 'Select one or more options' : 'Select one option'}
              </p>
              <p className="no-auth-needed">No registration required to vote</p>
            </div>

            <div className="options-list">
              {poll.options.map(option => {
                const isSelected = selectedOptions.includes(option.id);
                return (
                  <div 
                    key={option.id} 
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleOption(option.id)}
                    id={`option-${option.id}`}
                  >
                    <div className="option-indicator">
                      {poll.allow_multiple ? (
                        <div className={`checkbox ${isSelected ? 'checked' : ''}`}></div>
                      ) : (
                        <div className={`radio ${isSelected ? 'checked' : ''}`}></div>
                      )}
                    </div>
                    <span className="option-text">{option.text}</span>
                  </div>
                );
              })}
            </div>

            <div className="vote-actions">
              <button 
                id="cast-vote-btn"
                className="btn btn-primary vote-btn"
                onClick={handleVote}
                disabled={selectedOptions.length === 0 || submitting}
              >
                {submitting ? <div className="spinner"></div> : 'Cast Your Vote'}
              </button>
              <Link to={`/poll/${id}/results`} className="view-results-link">
                View results without voting
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VotePoll;
