import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import './styles.css';
import ThemeToggle from './components/ThemeToggle.jsx';

export default function App() {
  return (
    <div className="app">
      <nav className="nav">
        <div className="brand">Job Scraper</div>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/portals">Portals</Link>
          <Link to="/jobs">Jobs</Link>
          <ThemeToggle className="ml-2" />
        </div>
      </nav>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
