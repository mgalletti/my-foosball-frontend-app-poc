import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import App from './App.tsx'
import MapView from './MapView.tsx'
import MobileTemplate from './components/MobileLayout.tsx'
import { AppProvider } from './context/AppContext'
import { PlaceList } from './components/Places'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <MobileTemplate currentSection='home'>
        <PlaceList />
        <MapView />
      </MobileTemplate>
    </AppProvider>
  </StrictMode>,
)
