import React from 'react'
import ReactDOM from 'react-dom/client'
import Detail from './pages/Detail'
import { LocaleProvider } from './contexts/LocaleContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LocaleProvider>
      <Detail />
    </LocaleProvider>
  </React.StrictMode>,
) 