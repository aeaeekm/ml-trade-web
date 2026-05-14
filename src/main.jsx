import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Initialize theme before first render to prevent flash
const storedTheme = localStorage.getItem('theme-storage')
if (storedTheme) {
  try {
    const parsed = JSON.parse(storedTheme)
    if (parsed?.state?.isDark) {
      document.documentElement.classList.add('dark')
    }
  } catch {}
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.classList.add('dark')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
