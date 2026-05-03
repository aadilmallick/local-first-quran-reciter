import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { UiSettingsProvider } from './contexts/UiSettingsContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UiSettingsProvider>
      <App />
    </UiSettingsProvider>
  </StrictMode>,
)
