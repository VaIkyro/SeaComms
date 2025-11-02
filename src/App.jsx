import React, { useState, useEffect } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import CommendationsPage from "./pages/CommendationsPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AdminPage from "./pages/AdminPage";
import { supabase } from "./supabaseClient";

// ✅ Export adminEmails at top level
export const adminEmails = ["dylanvalkyro@gmail.com"]; // your admin emails

// Main App
export default function App() {
  return (
    <HashRouter basename="/SeaComms/">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected routes */}
        <Route path="/" element={<Protected><DashboardPage /></Protected>} />
        <Route path="/category/:id" element={<Protected><CommendationsPage /></Protected>} />
        <Route path="/admin" element={<Protected adminOnly={true}><AdminPage /></Protected>} />
      </Routes>
    </HashRouter>
  );
}

// Protected component
function Protected({ children, adminOnly = false }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const listener = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      mounted = false;
      if (listener && listener.subscription)
        listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!session) return <LoginPage />;

  // ✅ Check admin access
  if (adminOnly) {
    if (!adminEmails.includes(session.user.email)) {
      return <p style={{ padding: "20px" }}>Access denied: Admins only.</p>;
    }
  }

  return children;
}
