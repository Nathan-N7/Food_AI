import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'

//import './index.css'
import App from './App.jsx'

const updateSW = registerSW({
  onNeedRefresh() {
  },
  onOfflineReady() {
    console.log('O app está pronto para funcionar offline!')
  },
})
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)