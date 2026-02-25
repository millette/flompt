import React from 'react'
import ReactDOM from 'react-dom/client'
import { LocaleProvider } from '@/i18n/LocaleContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LocaleProvider>
        <App />
      </LocaleProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
