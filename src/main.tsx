import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './pages/App'
import { LocaleProvider } from './contexts/LocaleContext'
import { AppProvider } from './contexts/AppContext'
import { ToastProvider } from './components/Common/Toast'
import { ErrorBoundary } from './components/Common/ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LocaleProvider>
        <AppProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AppProvider>
      </LocaleProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
