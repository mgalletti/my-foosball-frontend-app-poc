/**
 * @fileoverview Main App component with section-based navigation
 * 
 * This is the root component of the Foosball Challenge App that provides:
 * - Global state management through AppProvider
 * - Section-based navigation (Home, Places, Challenges, Profile)
 * - App-level loading and error handling
 * - Proper component mounting and unmounting
 * 
 * @version 1.0.0
 */

import { useEffect, useState, useCallback, Suspense, Component } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress, Alert, Button, Typography } from '@mui/material';
import { AppProvider, useNavigation, useAppState, usePlaces, useChallenges, usePlayer } from './context/AppContext';
import { 
  MobileLayout, 
  PlacesList, 
  ChallengesList, 
  ChallengeForm, 
  PlayerProfile 
} from './components';
import MapView from './components/MapView';
import { PlacesService } from './services/PlacesService';
import { ChallengesService } from './services/ChallengesService';
import { PlayersService } from './services/PlayersService';
import type { Place, Player } from './types';
import './App.css';

// Create Material-UI theme optimized for mobile
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 44, // Touch-friendly button size
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minHeight: 44,
          minWidth: 44,
        },
      },
    },
  },
});

/**
 * Error Boundary component for handling React errors gracefully
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            Something went wrong. Please refresh the page to try again.
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

/**
 * Loading component for app initialization
 */
const AppLoading = () => (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    flexDirection: 'column',
    gap: 2
  }}>
    <CircularProgress size={48} />
    <Box sx={{ textAlign: 'center' }}>
      Loading Foosball Challenge App...
    </Box>
  </Box>
);

/**
 * Home section component combining MapView with quick actions
 */
interface HomeSectionProps {
  onCreateChallenge: (place: Place) => void;
}

const HomeSection = ({ onCreateChallenge }: HomeSectionProps) => {
  const { places } = usePlaces();
  const { challenges } = useChallenges();
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  // Filter recent challenges (last 7 days)
  const recentChallenges = challenges.filter(challenge => {
    const challengeDate = new Date(challenge.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return challengeDate >= weekAgo && challenge.status === 'Open';
  }).slice(0, 3); // Show only 3 most recent

  const handlePlaceSelect = useCallback((place: Place) => {
    console.log('AppContent: handlePlaceSelect called with place:', place);
    setSelectedPlace(place);
  }, []);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Map takes most of the space */}
      <Box sx={{ flex: 1, minHeight: 300 }}>
        <MapView
          places={places}
          selectedPlace={selectedPlace || undefined}
          onPlaceSelect={handlePlaceSelect}
          onCreateChallenge={onCreateChallenge}
        />
      </Box>
      
      {/* Quick stats and actions */}
      <Box sx={{ p: 2, backgroundColor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{places.length}</Box>
            <Box sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Places</Box>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{challenges.filter(c => c.status === 'Open').length}</Box>
            <Box sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Open Challenges</Box>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{recentChallenges.length}</Box>
            <Box sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Recent</Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

/**
 * Main app content component that handles section routing
 */
const AppContent = () => {
  const { currentSection, setCurrentSection } = useNavigation();
  
  const { setLoading, setError, clearError } = useAppState();
  const { places, setPlaces } = usePlaces();
  const { challenges, setChallenges } = useChallenges();
  const { currentPlayer, setCurrentPlayer } = usePlayer();
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [selectedPlaceForChallenge, setSelectedPlaceForChallenge] = useState<Place | null>(null);

  // Initialize app data on mount
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = useCallback(async () => {
    setLoading(true);
    clearError();

    try {
      // Load initial data in parallel, but don't fail the entire app if some fail
      const [placesData, challengesData, playerData] = await Promise.allSettled([
        PlacesService.getActivePlaces(),
        ChallengesService.getOpenChallenges(),
        PlayersService.getCurrentPlayer()
      ]);

      // Handle places data
      if (placesData.status === 'fulfilled') {
        setPlaces(placesData.value);
      } else {
        console.warn('Failed to load places:', placesData.reason);
        setPlaces([]); // Set empty array so app can still work
      }

      // Handle challenges data
      if (challengesData.status === 'fulfilled') {
        setChallenges(challengesData.value);
      } else {
        console.warn('Failed to load challenges:', challengesData.reason);
        setChallenges([]); // Set empty array so app can still work
      }

      // Handle player data
      if (playerData.status === 'fulfilled') {
        setCurrentPlayer(playerData.value);
      } else {
        console.warn('Failed to load player:', playerData.reason);
        // Player is optional, so don't set anything
      }

    } catch (err) {
      // This should rarely happen with Promise.allSettled, but just in case
      console.error('Unexpected error during app initialization:', err);
      setPlaces([]);
      setChallenges([]);
    } finally {
      setLoading(false); // Always stop loading, even if some things failed
    }
  }, [setPlaces, setChallenges, setCurrentPlayer, setLoading, clearError]);

  const handlePlaceSelect = useCallback((_place: Place) => {
    // For now, just log the selection - we can add more functionality later
  }, []);

  const handleCreateChallenge = useCallback((place: Place) => {
    setSelectedPlaceForChallenge(place);
    setShowChallengeForm(true);
  }, []);

  const handleChallengeFormSubmit = useCallback(async () => {
    // This will be handled by the ChallengeForm component
    setShowChallengeForm(false);
    setSelectedPlaceForChallenge(null);
  }, []);

  const handleChallengeFormCancel = useCallback(() => {
    setShowChallengeForm(false);
    setSelectedPlaceForChallenge(null);
  }, []);

  const handleJoinChallenge = useCallback(async (challengeId: string) => {
    if (!currentPlayer) return;
    
    try {
      setLoading(true);
      await ChallengesService.joinChallenge(challengeId, currentPlayer.id);
      
      // Refresh challenges to get updated data
      const updatedChallenges = await ChallengesService.getOpenChallenges();
      setChallenges(updatedChallenges);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError({
        type: 'server',
        message: `Failed to join challenge: ${errorMessage}`,
        retryable: true
      });
    }
  }, [currentPlayer, setChallenges, setLoading, setError]);

  const handleUpdateProfile = useCallback(async (updates: Partial<Player>) => {
    if (!currentPlayer) return;

    try {
      setLoading(true);
      const updatedPlayer = await PlayersService.updatePlayer(updates);
      setCurrentPlayer(updatedPlayer);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError({
        type: 'server',
        message: `Failed to update profile: ${errorMessage}`,
        retryable: true
      });
    }
  }, [currentPlayer, setCurrentPlayer, setLoading, setError]);

  // Note: Removed blocking error display - let the app render even if some API calls fail

  // Render current section content
  const renderSectionContent = () => {
    
    switch (currentSection) {
      case 'home':
        return <HomeSection onCreateChallenge={handleCreateChallenge} />;
      
      case 'places':
        return (
          <Box>
            <Typography variant="h6" sx={{ p: 2 }}>
              Places Section (Debug: {places.length} places)
            </Typography>
            <PlacesList 
              places={places}
              onPlaceSelect={handlePlaceSelect}
              onCreateChallenge={handleCreateChallenge}
            />
          </Box>
        );
      
      case 'challenges':
        return (
          <Box>
            <Typography variant="h6" sx={{ p: 2 }}>
              Challenges Section (Debug: {challenges.length} challenges)
            </Typography>
            <ChallengesList 
              challenges={challenges}
              onJoinChallenge={handleJoinChallenge}
              onCreateChallenge={() => setCurrentSection('places')}
            />
          </Box>
        );
      
      case 'profile':
        return (
          <Box>
            <Typography variant="h6" sx={{ p: 2 }}>
              Profile Section (Debug: Player {currentPlayer ? 'found' : 'not found'})
            </Typography>
            {currentPlayer ? (
              <PlayerProfile 
                player={currentPlayer}
                onUpdateProfile={handleUpdateProfile}
              />
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Alert severity="info">
                  No player profile found. Please create a profile to continue.
                </Alert>
              </Box>
            )}
          </Box>
        );
      
      default:
        return <HomeSection onCreateChallenge={handleCreateChallenge} />;
    }
  };

  return (
    <MobileLayout currentSection={currentSection}>
      <Suspense fallback={<AppLoading />}>
        {renderSectionContent()}
      </Suspense>
      
      {/* Challenge Form Dialog */}
      {showChallengeForm && selectedPlaceForChallenge && (
        <ChallengeForm
          place={selectedPlaceForChallenge}
          onSubmit={handleChallengeFormSubmit}
          onCancel={handleChallengeFormCancel}
        />
      )}
    </MobileLayout>
  );
};

/**
 * Root App component with providers and error boundary
 */
function App() {
  return (
    <AppErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppProvider>
          <Suspense fallback={<AppLoading />}>
            <AppContent />
          </Suspense>
        </AppProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  );
}

export default App;
