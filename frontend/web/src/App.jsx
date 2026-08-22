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
          <ProtectedRoute>
            <Register/>
          </ProtectedRoute>
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
          <ProtectedRoute>
            <Privacy/>
          </ProtectedRoute>
        }
      />


             <Route
        path="/terms"
        element={
          <ProtectedRoute>
            <Terms/>
          </ProtectedRoute>
        }
      />


    </Routes>
  )
}

export default App