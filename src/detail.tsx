import React from 'react'
import ReactDOM from 'react-dom/client'
import Detail from './pages/Detail'
import { LocaleProvider } from './contexts/LocaleContext'
import { ToastProvider } from './components/Common/Toast'
import { ErrorBoundary } from './components/Common/ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LocaleProvider>
        <ToastProvider>
          <Detail />
        </ToastProvider>
      </LocaleProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
