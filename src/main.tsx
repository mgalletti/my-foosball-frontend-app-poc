import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import App from './App.tsx'
import MapView from './MapView.tsx'
// import MobileTemplate from './MobileTemplate.tsx'
import { PlaceList } from './components/Places'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PlaceList />
    <MapView />
  </StrictMode>,
)
