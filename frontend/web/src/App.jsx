import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import Login from './components/Login.jsx'
import Generate from './components/Generate.jsx'
import History from './components/History'
import Register from './components/Register'
import Dashboard from './components/Dashboard.jsx'
import Privacy from './components/Privacy.jsx'
import Terms from './components/Terms.jsx'
import Profile from './components/Profile.jsx'
import Friends from './components/Friends.jsx'
import Chat from './components/Chat.jsx'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  useEffect(() => {
    const pingServer = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await fetch('/api/ping/', {
            method: 'POST',
            headers: {
              'Authorization': `Token ${token}`
            }
          });
        } catch (error) {
          console.error('Ping failed:', error);
        }
      }
    };

    pingServer(); // Initial ping
    const interval = setInterval(pingServer, 60000); // Ping every 60 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/generate"
        element={
          <ProtectedRoute>
            <Generate />
          </ProtectedRoute>
        }
      />

      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        }
      />

      <Route
        path="/register"
        element={
          <Register />
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/privacy"
        element={
          <Privacy />
        }
      />

      <Route
        path="/terms"
        element={
          <Terms />
        }
      />

      {/* Social Routes */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile/:userId"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/friends"
        element={
          <ProtectedRoute>
            <Friends />
          </ProtectedRoute>
        }
      />

      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />

      <Route
        path="/chat/:userId"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />

    </Routes>
    </>
  )
}

export default App
