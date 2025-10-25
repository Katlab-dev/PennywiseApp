import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  function linkClass({ isActive }) {
    return `nav-link${isActive ? ' active' : ''}`;
  }

  // Hide on auth routes
  if (['/auth', '/login', '/register'].some((p) => location.pathname.startsWith(p))) {
    return null;
  }

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <div className="brand">
          <span className="logo" aria-hidden>💸</span>
          <span className="brand-text">PennyWise</span>
        </div>

        <button
          className="menu-toggle"
          aria-label="Toggle navigation"
          aria-controls="primary-navigation"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>

        <nav id="primary-navigation" className={`nav-links ${open ? 'open' : ''}`}>
          <NavLink to="/" end className={linkClass} onClick={() => setOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/add-expense" className={linkClass} onClick={() => setOpen(false)}>
            Add Expense
          </NavLink>
          <NavLink to="/income" className={linkClass} onClick={() => setOpen(false)}>
            Add Income
          </NavLink>
          <NavLink to="/history" className={linkClass} onClick={() => setOpen(false)}>
            History
          </NavLink>
          <NavLink to="/budget" className={linkClass} onClick={() => setOpen(false)}>
            Budget
          </NavLink>
          <NavLink to="/goals" className={linkClass} onClick={() => setOpen(false)}>
            Goals
          </NavLink>
          <NavLink to="/reports" className={linkClass} onClick={() => setOpen(false)}>
            Reports
          </NavLink>
          {!currentUser ? (
            <>
              <NavLink to="/login" className={linkClass} onClick={() => setOpen(false)}>
                Login
              </NavLink>
              <NavLink to="/register" className={linkClass} onClick={() => setOpen(false)}>
                Register
              </NavLink>
            </>
          ) : (
            <button
              type="button"
              className="nav-link"
              onClick={async () => {
                await logout();
                setOpen(false);
                navigate('/');
              }}
            >
              Logout
            </button>
          )}
          <button type="button" className="nav-link" aria-pressed={theme === 'dark'} onClick={() => { toggleTheme(); setOpen(false); }}>
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </nav>
      </div>
    </header>
  );
}
