import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import './Register.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const getPasswordStrength = () => {
    if (!password) return { label: '', color: 'transparent', width: '0%' };
    if (password.length < 6) return { label: 'Weak', color: 'var(--danger)', width: '33%' };
    if (password.length < 10 || !/\d/.test(password)) return { label: 'Medium', color: '#fbbf24', width: '66%' };
    return { label: 'Strong', color: 'var(--success)', width: '100%' };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password);
      addToast('Account created successfully', 'success');
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err.message || 'Failed to register';
      setError(errorMessage);
      addToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-card auth-card">
        <h2 className="auth-title gradient-text">Create Account</h2>
        <p className="auth-subtitle">Join PulsePoll to create live polls</p>

        <div className="backend-status-info">
          <span className="info-icon">ℹ️</span>
          <span>Backend server must be running for registration to work</span>
        </div>

        {error && <div className="auth-error shake">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <input 
              type="text" 
              id="name" 
              className="form-input" 
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              className="form-input" 
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              className="form-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {password && (
              <div className="password-strength">
                <div className="strength-bar-bg">
                  <div 
                    className="strength-bar-fill" 
                    style={{ width: strength.width, backgroundColor: strength.color }}
                  ></div>
                </div>
                <span className="strength-label" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <input 
              type="password" 
              id="confirmPassword" 
              className="form-input" 
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {confirmPassword && (
              <div className="password-match">
                {password === confirmPassword ? (
                  <span style={{ color: 'var(--success)' }}>✓ Passwords match</span>
                ) : (
                  <span style={{ color: 'var(--danger)' }}>✗ Passwords do not match</span>
                )}
              </div>
            )}
          </div>
          
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? <div className="spinner"></div> : 'Register'}
          </button>
        </form>
        
        <div className="auth-footer">
          Already have an account? <Link to="/login" className="auth-link">Log In</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
