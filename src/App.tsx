import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginDialog } from './components/LoginDialog';
import { SignupDialog } from './components/SignupDialog';
import { useAuth } from './hooks/useAuth';
import { DashboardLayout } from './components/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Agents } from './pages/Agents';
import { CreateAgent } from './pages/CreateAgent';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { PhoneNumbers } from './pages/PhoneNumbers';
import { CallHistory } from './pages/CallHistory';
import { Billing } from './pages/Billing';

function AuthenticatedApp() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route path="/home" element={<Dashboard />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/agents/create" element={<CreateAgent />} />
        <Route path="/knowledge-base" element={<KnowledgeBase />} />
        <Route path="/phone-numbers" element={<PhoneNumbers />} />
        <Route path="/call-history" element={<CallHistory />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  );
}

function UnauthenticatedApp({ onOpenLogin }: { onOpenLogin: () => void }) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <button
        onClick={onOpenLogin}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Open Login
      </button>
    </div>
  );
}

function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const { user, loading } = useAuth();

  const handleSwitchToSignup = () => {
    setIsLoginOpen(false);
    setIsSignupOpen(true);
  };

  const handleSwitchToLogin = () => {
    setIsSignupOpen(false);
    setIsLoginOpen(true);
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  return (
    <BrowserRouter>
      {user ? (
        <AuthenticatedApp />
      ) : (
        <UnauthenticatedApp onOpenLogin={() => setIsLoginOpen(true)} />
      )}

      <LoginDialog 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)}
        onSwitchToSignup={handleSwitchToSignup}
      />

      <SignupDialog
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </BrowserRouter>
  );
}

export default App;