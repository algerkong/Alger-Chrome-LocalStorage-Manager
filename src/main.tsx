import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { LocaleProvider } from './contexts/LocaleContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LocaleProvider>
      <App />
    </LocaleProvider>
  </React.StrictMode>,
)
