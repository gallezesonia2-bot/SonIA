import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import SignSplitMockup from './components/SignSplitMockup.jsx'

const root = createRoot(document.getElementById('root'))

if (typeof window !== 'undefined' && window.location.pathname === '/mockup/sign-split') {
  root.render(
    <StrictMode>
      <SignSplitMockup />
    </StrictMode>,
  )
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
