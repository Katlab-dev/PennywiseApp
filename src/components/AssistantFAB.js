import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AssistantFAB() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Hide on auth pages and optionally on the assistant page itself
  const hideOn = ['/auth', '/login', '/register'];
  const isAuthPath = hideOn.some((p) => location.pathname.startsWith(p));
  if (!currentUser || isAuthPath) return null;

  return (
    <button
      type="button"
      className="assistant-fab"
      aria-label="Open Assistant"
      title="Open Assistant"
      onClick={() => navigate('/assistant')}
    >
      <span className="assistant-fab__icon" aria-hidden>💬</span>
      <span className="assistant-fab__label">Assistant</span>
    </button>
  );
}
