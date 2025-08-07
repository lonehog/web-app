import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import './styles.css';
import { api } from './api';
import ThemeToggle from './components/ThemeToggle.jsx';

export default function App() {
  const loc = useLocation();
  const navigate = useNavigate();

  async function handleLogout() {
    // Clear cookie by setting empty token via server could be added; for now just navigate to login.
    // A real logout endpoint can be added if needed.
    navigate('/login');
  }

  const isAuthPage = loc.pathname === '/login' || loc.pathname === '/signup';

  return (
    <div className="app">
      {!isAuthPage && (
        <nav className="nav">
          <div className="brand">Job Scraper</div>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/portals">Portals</Link>
            <Link to="/jobs">Jobs</Link>
            <Link to="/credentials">Credentials</Link>
            <button className="linklike" onClick={handleLogout}>Logout</button>
            <ThemeToggle className="ml-2" />
          </div>
        </nav>
      )}
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
