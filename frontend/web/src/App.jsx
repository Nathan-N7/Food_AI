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
import Profile from './components/Profile.jsx'
import UserProfile from './components/UserProfile.jsx'
import Friends from './components/Friends.jsx'
import Privacy from './components/Privacy.jsx'
import Terms from './components/Terms.jsx'
import { useAuth } from './context/AuthContext.jsx'


function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  // Wait for the /me bootstrap before deciding where to route.
  if (loading) {
    return null
  }

  if (!isAuthenticated) {
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
        path="/register"
        element={<Register />}
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
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile/:id"
        element={
          <ProtectedRoute>
            <UserProfile />
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
        path="/privacy"
        element={<Privacy />}
      />

      <Route
        path="/terms"
        element={<Terms />}
      />
    </Routes>
  )
}

export default App
