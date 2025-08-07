import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api } from '../api';

export default function ProtectedRoute({ children }) {
  const [allowed, setAllowed] = useState(null);
  const [signupOpen, setSignupOpen] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    let mounted = true;
    // Heuristic: call a protected endpoint to see if we get 200 vs 401.
    api.getMetrics()
      .then(() => mounted && setAllowed(true))
      .catch(async (err) => {
        if (!mounted) return;
        // If no users exist, backend signup allowed; we can't know directly.
        // We optimistically allow hitting /signup page if user tries.
        setAllowed(false);
      });
    return () => { mounted = false; };
  }, [loc.pathname]);

  if (allowed === null) return <div className="center">Loading…</div>;
  if (!allowed) return <Navigate to="/login" replace />;
  return children;
}
