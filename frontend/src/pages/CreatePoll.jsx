import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../services/api';
import './CreatePoll.css';

const CreatePoll = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState([{ id: 1, text: '' }, { id: 2, text: '' }]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      addToast('Please login to create a poll', 'info');
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate, addToast]);

  const handleAddOption = () => {
    if (options.length >= 10) return;
    setOptions([...options, { id: Date.now(), text: '' }]);
  };

  const handleRemoveOption = (id) => {
    if (options.length <= 2) return;
    setOptions(options.filter(opt => opt.id !== id));
  };

  const handleOptionChange = (id, text) => {
    setOptions(options.map(opt => opt.id === id ? { ...opt, text } : opt));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      addToast('Poll title is required', 'error');
      return;
    }

    const validOptions = options.filter(o => o.text.trim());
    if (validOptions.length < 2) {
      addToast('Provide at least 2 options', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const pollData = {
        title,
        description,
        options: validOptions.map(o => o.text.trim()),
        allowMultiple
      };
      
      const res = await api.post('/api/polls', pollData);
      addToast('Poll created successfully!', 'success');
      // Assume response contains { id: '...' }
      navigate(`/poll/${res.id}/results`);
    } catch (err) {
      addToast(err.message || 'Failed to create poll', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !isAuthenticated) return null;

  return (
    <div className="create-poll-container">
      <div className="glass-card create-card">
        <h1 className="gradient-text form-title">Create a New Poll</h1>
        
        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-section">
            <div className="form-group">
              <label className="form-label" htmlFor="title">Question / Title</label>
              <input 
                type="text" 
                id="title" 
                className="form-input" 
                placeholder="What would you like to ask?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="description">Description (Optional)</label>
              <textarea 
                id="description" 
                className="form-input" 
                placeholder="Add more context or details here..."
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="form-section options-section">
            <label className="form-label">Options</label>
            {options.map((option, index) => (
              <div key={option.id} className="option-row">
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder={`Option ${index + 1}`}
                  value={option.text}
                  onChange={(e) => handleOptionChange(option.id, e.target.value)}
                />
                <button 
                  type="button" 
                  className="btn btn-outline remove-btn"
                  onClick={() => handleRemoveOption(option.id)}
                  disabled={options.length <= 2}
                  title="Remove option"
                >
                  🗑️
                </button>
              </div>
            ))}
            
            {options.length < 10 && (
              <button 
                type="button" 
                className="btn btn-outline add-option-btn"
                onClick={handleAddOption}
              >
                + Add Option
              </button>
            )}
          </div>

          <div className="form-section settings-section">
            <label className="form-label">Settings</label>
            <div className="setting-row">
              <div className="setting-info">
                <h4>Allow multiple votes</h4>
                <p>Voters can select more than one option</p>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={allowMultiple}
                  onChange={(e) => setAllowMultiple(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? <div className="spinner"></div> : 'Create Poll'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePoll;
