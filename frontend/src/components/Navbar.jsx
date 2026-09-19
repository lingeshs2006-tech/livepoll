import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';
import { useState } from 'react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">⚡</span>
          <span className="gradient-text">PulsePoll</span>
        </Link>

        <div className="menu-icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <div className={mobileMenuOpen ? "hamburger active" : "hamburger"}></div>
        </div>

        <ul className={mobileMenuOpen ? "nav-menu active" : "nav-menu"}>
          <li className="nav-item">
            <Link to="/" className={isActive('/') ? 'nav-link active' : 'nav-link'} onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
          </li>
          
          {isAuthenticated && (
            <li className="nav-item">
              <Link to="/create" className={isActive('/create') ? 'nav-link active' : 'nav-link'} onClick={() => setMobileMenuOpen(false)}>
                Create Poll
              </Link>
            </li>
          )}

          {!isAuthenticated ? (
            <li className="nav-item auth-buttons">
              <Link to="/login" className="btn btn-outline" onClick={() => setMobileMenuOpen(false)}>Login</Link>
              <Link to="/register" className="btn btn-primary" onClick={() => setMobileMenuOpen(false)}>Register</Link>
            </li>
          ) : (
            <li className="nav-item user-menu">
              <span className="user-greeting">Hi, {user?.name || 'User'}</span>
              <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="btn btn-outline">Logout</button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
