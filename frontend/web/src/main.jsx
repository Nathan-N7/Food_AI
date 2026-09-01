import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'

//import './index.css'
import './i18n.js'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { PresenceProvider } from './context/PresenceContext.jsx'

const updateSW = registerSW({
  onNeedRefresh() {
  },
  onOfflineReady() {
    console.log('O app está pronto para funcionar offline!')
  },
})
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense>
      <BrowserRouter>
        <AuthProvider>
          <PresenceProvider>
            <App />
          </PresenceProvider>
        </AuthProvider>
      </BrowserRouter>
    </Suspense>
  </StrictMode>,
)
