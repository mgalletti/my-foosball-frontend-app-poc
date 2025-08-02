import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import './index.css'
import MapView from './components/MapView.tsx'
import MobileLayout from './components/MobileLayout.tsx'
import { AppProvider } from './context/AppContext'


// Create a theme for consistent Material-UI rendering
const theme = createTheme({
  palette: {
    mode: 'light',
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <MobileLayout currentSection='home'>
          <MapView />
        </MobileLayout>
      </AppProvider>
    </ThemeProvider>
  </StrictMode>
)
