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
  return (
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
  )
}

export default App
