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


function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}

function GeneratePlaceholder() {
  return (
    <main>
      <h1>Food AI</h1>
      <h2>Generate</h2>

      <p>Usuário autenticado.</p>
    </main>
  )
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


    </Routes>
  )
}

export default App