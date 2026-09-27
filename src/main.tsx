import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { routeExternalLinks } from '@/lib/open'
import './index.css'
import { personal } from '@/config/personal'

routeExternalLinks()
document.title = personal.appName

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
