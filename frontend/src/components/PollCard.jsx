import { Link } from 'react-router-dom';
import './PollCard.css';

const PollCard = ({ poll }) => {
  // Format date nicely
  const getRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const isActive = poll.is_active;

  return (
    <Link to={`/poll/${poll.id}/results`} className="poll-card-link">
      <div className="glass-card poll-card">
        <div className="poll-card-header">
          <span className={`badge ${isActive ? 'badge-active' : 'badge-closed'}`}>
            {isActive ? 'Active' : 'Closed'}
          </span>
          <span className="poll-date">{getRelativeTime(poll.created_at)}</span>
        </div>
        
        <h3 className="poll-title">{poll.title}</h3>
        
        {poll.description && (
          <p className="poll-description">
            {poll.description.length > 80 
              ? `${poll.description.substring(0, 80)}...` 
              : poll.description}
          </p>
        )}
        
        <div className="poll-stats">
          <div className="stat">
            <span className="stat-value">{poll.options?.length || 0}</span>
            <span className="stat-label">Options</span>
          </div>
          <div className="stat">
            <span className="stat-value">{poll.total_votes || 0}</span>
            <span className="stat-label">Votes</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PollCard;
