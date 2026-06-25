import { createRoot } from 'react-dom/client'
import { AppProvider } from '@/store/AppContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <AppProvider>
    <App />
  </AppProvider>
)
