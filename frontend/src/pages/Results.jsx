import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useToast } from '../components/Toast';
import api from '../services/api';
import ws from '../services/ws';
import './Results.css';

const Results = () => {
  const { id } = useParams();
  const { addToast } = useToast();
  
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [totalVotes, setTotalVotes] = useState(0);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef(null);

  // Initialize and load poll
  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const data = await api.get(`/api/polls/${id}`);
        setPoll(data);
        pollRef.current = data;
        const total = data.options.reduce((sum, opt) => sum + (opt.vote_count || 0), 0);
        setTotalVotes(total);
      } catch (err) {
        addToast('Failed to load poll results', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPoll();
  }, [id]);

  // WebSocket connection for live updates
  useEffect(() => {
    if (!poll) return;

    ws.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    ws.onMessage((data) => {
      // Backend sends two types of messages:
      // 1. { type: "initial_counts", counts: { optionId: count } }
      // 2. VoteUpdate: { poll_id, option_id, counts: { optionId: count } }
      
      const counts = data.counts;
      if (!counts || !pollRef.current) return;

      setPoll(prevPoll => {
        if (!prevPoll) return prevPoll;
        const updatedOptions = prevPoll.options.map(opt => ({
          ...opt,
          vote_count: counts[opt.id] || prevPoll.options.find(o => o.id === opt.id)?.vote_count || 0,
        }));
        const updatedPoll = { ...prevPoll, options: updatedOptions };
        pollRef.current = updatedPoll;
        return updatedPoll;
      });

      // Recalculate total
      let total = 0;
      Object.values(counts).forEach(c => { total += c; });
      setTotalVotes(total);
    });

    ws.connect(id);

    return () => {
      ws.disconnect();
    };
  }, [id, poll?.id]);

  const handleCopyLink = () => {
    // Use network IP for sharing (works on local network)
    const networkUrl = `http://192.168.1.142:5176/poll/${id}`;

    // Copy network URL by default for sharing
    navigator.clipboard.writeText(networkUrl).then(() => {
      setCopied(true);
      addToast('Share link copied! Works on your local network', 'success');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return <div className="results-container flex-center"><div className="spinner large"></div></div>;
  }

  if (!poll) {
    return <div className="results-container flex-center"><div className="glass-card" style={{padding: '2rem', textAlign: 'center'}}>Poll not found</div></div>;
  }

  // Find max votes for leading badge
  const maxVotes = Math.max(...poll.options.map(o => o.vote_count || 0));

  return (
    <div className="results-container">
      <div className="glass-card results-card">
        <div className="results-header">
          <div className="status-indicators">
            <div className={`ws-status status-${connectionStatus}`}>
              <div className="status-dot"></div>
              {connectionStatus === 'connected' ? 'Live' : 
               connectionStatus === 'connecting' ? 'Connecting...' : 
               connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'Disconnected'}
            </div>
            {poll.is_active ? (
              <span className="badge badge-active">Active</span>
            ) : (
              <span className="badge badge-closed">Closed</span>
            )}
          </div>
          
          <h1 className="results-title">{poll.title}</h1>
          {poll.description && <p className="results-description">{poll.description}</p>}
        </div>

        <div className="results-body">
          {poll.options.map(option => {
            const count = option.vote_count || 0;
            const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const isLeading = count === maxVotes && count > 0;
            
            return (
              <div key={option.id} className={`result-row ${isLeading ? 'leading' : ''}`}>
                <div className="result-info">
                  <span className="result-text">
                    {option.text}
                    {isLeading && <span className="leading-badge">🏆 Leading</span>}
                  </span>
                  <span className="result-stats">{count} vote{count !== 1 ? 's' : ''} · {percentage}%</span>
                </div>
                <div className="progress-bg">
                  <div 
                    className={`progress-fill ${isLeading ? 'progress-leading' : ''}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="results-footer">
          <div className="total-votes">
            <span className="total-label">Total Votes</span>
            <span className="total-number">{totalVotes}</span>
          </div>

          <div className="no-auth-info">
            <span>🎉 No registration required to vote!</span>
          </div>

          <div className="action-buttons">
            <button id="copy-link-btn" className="btn btn-outline copy-btn" onClick={handleCopyLink}>
              {copied ? '✅ Copied!' : '🔗 Copy Share Link'}
            </button>
            <Link to={`/poll/${id}`} className="btn btn-primary">
              Vote on this poll
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
