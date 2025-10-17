/**
 * @fileoverview Enhanced MapView component for displaying foosball places on an interactive map
 * 
 * This component provides a comprehensive map interface for the Foosball Challenge App,
 * featuring place visualization, selection, and challenge creation capabilities.
 * Optimized for mobile devices with touch-friendly interactions.
 * 
 * @version 1.0.0
 */

import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Skeleton
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { usePlaces, useAppState } from '../context/AppContext';
import { PlacesService } from '../services/PlacesService';
import type { Place } from '../types';

/**
 * Creates a custom Leaflet icon for place markers with mobile-optimized sizing
 * 
 * @param isSelected - Whether the marker represents a selected place (changes color)
 * @returns Leaflet Icon instance configured for mobile touch interactions
 * 
 * @example
 * ```typescript
 * const selectedIcon = createCustomIcon(true);  // Green icon for selected place
 * const normalIcon = createCustomIcon(false);   // Blue icon for normal place
 * ```
 */
const createCustomIcon = (isSelected: boolean = false) => new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-' + (isSelected ? 'green' : 'blue') + '.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [32, 52], // Larger size for better mobile touch targets
  iconAnchor: [16, 52],
  popupAnchor: [1, -44],
  shadowSize: [52, 52]
});

/**
 * OSM Compliance: Set up fetch interceptor for proper User-Agent
 */
const setupOSMCompliance = () => {
  // Store original fetch
  const originalFetch = window.fetch;

  // Override fetch for OSM tile requests
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    // Check if this is an OSM tile request
    // if (url && url.includes('tile.openstreetmap.org')) {
      const headers = new Headers(init?.headers);

      // Set proper User-Agent for OSM compliance
      console.log("HERE I'M SETTING THE User-Agent HEADER")
      headers.set('User-Agent', 'Foosball Challenge App/0.0.0 (https://github.com/your-username/foosball-app; contact@foosball-app.com)');

      // Ensure proper referer
      if (!headers.has('Referer')) {
        headers.set('Referer', window.location.href);
      }

      // Update init with new headers
      const newInit = {
        ...init,
        headers,
        cache: 'default' as RequestCache // Respect caching headers
      };

      return originalFetch.call(this, input, newInit);
    // }

    // For non-OSM requests, use original fetch
    return originalFetch.call(this, input, init);
  };

  // Return cleanup function
  return () => {
    window.fetch = originalFetch;
  };
};

/**
 * MapEventHandler - Handles map-level events like clicks outside of markers
 * 
 * This component uses the react-leaflet useMapEvents hook to listen for map interactions.
 * Memoized for performance optimization to prevent unnecessary re-renders.
 * 
 * @param onMapClick - Callback function triggered when the map (not a marker) is clicked
 * @returns null (this is an event handler component with no visual output)
 */
const MapEventHandler = memo(({ onMapClick }: { onMapClick: () => void }) => {
  useMapEvents({
    click: onMapClick,
  });
  return null;
});



export interface MapViewProps {
  places: Place[];
  onPlaceSelect: (place: Place) => void;
  selectedPlace?: Place;
}

/**
 * Props interface for the MapView component extending the base MapViewProps
 */
interface MapViewComponentProps extends Partial<MapViewProps> {
  /** Optional callback for handling challenge creation from a place */
  onCreateChallenge?: (place: Place) => void;
}

/**
 * Props interface for the PlaceMarker component
 */
interface PlaceMarkerProps {
  /** The place data to display as a marker */
  place: Place;
  /** Whether this marker represents the currently selected place */
  isSelected: boolean;
  /** Callback function when the marker/place is selected */
  onPlaceSelect: (place: Place) => void;
  /** Optional callback for creating a challenge at this place */
  onCreateChallenge?: (place: Place) => void;
}

/**
 * PlaceMarker - Individual marker component for displaying a foosball place on the map
 * 
 * This component renders a single place as a Leaflet marker with an interactive popup.
 * Memoized for performance optimization to prevent unnecessary re-renders when parent updates.
 * 
 * Features:
 * - Custom icon that changes color based on selection state
 * - Interactive popup with place details and challenge creation button
 * - Touch-optimized for mobile devices
 * - Prevents event bubbling for challenge creation
 * 
 * @param props - PlaceMarkerProps containing place data and event handlers
 * @returns JSX element representing a Leaflet Marker with Popup
 */
const PlaceMarker = memo(({
  place,
  isSelected,
  onPlaceSelect,
  onCreateChallenge
}: PlaceMarkerProps) => {
  const handleCreateChallenge = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCreateChallenge) {
      onCreateChallenge(place);
    }
  }, [place, onCreateChallenge]);

  return (
    <Marker
      key={place.id}
      position={[place.coordinates.lat, place.coordinates.long]}
      icon={createCustomIcon(isSelected)}
      eventHandlers={{
        click: () => onPlaceSelect(place),
      }}
    >
      <Popup>
        <Box sx={{ minWidth: 200, p: 1 }}>
          <Typography variant="h6" gutterBottom>
            {place.name}
          </Typography>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            ID: {place.id}
          </Typography>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            Coordinates: {place.coordinates.lat.toFixed(4)}, {place.coordinates.long.toFixed(4)}
          </Typography>

          <Box sx={{ mt: 1, mb: 1 }}>
            <Chip
              label="Available"
              color="success"
              size="small"
            />
          </Box>

          <Button
            variant="contained"
            color="primary"
            fullWidth
            size="small"
            onClick={handleCreateChallenge}
            sx={{ mt: 1 }}
          >
            Create Challenge
          </Button>
        </Box>
      </Popup>
    </Marker>
  );
});

/**
 * MapView - Main interactive map component for displaying foosball places
 * 
 * This is the primary map interface component that displays foosball places on an interactive
 * Leaflet map. It supports both controlled and uncontrolled usage patterns, making it flexible
 * for different use cases throughout the application.
 * 
 * Key Features:
 * - Interactive Leaflet map with OpenStreetMap tiles
 * - Place markers with selection states and popups
 * - Mobile-optimized touch interactions
 * - Automatic data loading from API or accepts external data
 * - Challenge creation integration
 * - Comprehensive error handling and loading states
 * - Performance optimizations with memoization
 * 
 * Usage Patterns:
 * 1. Standalone (uncontrolled): Manages its own state and data loading
 * 2. Controlled: Accepts places data and selection handlers from parent
 * 
 * @param props - MapViewComponentProps containing optional places data and event handlers
 * @returns Memoized JSX element representing the complete map interface
 * 
 * @example
 * ```typescript
 * // Standalone usage (loads its own data)
 * <MapView onCreateChallenge={handleCreateChallenge} />
 * 
 * // Controlled usage (parent manages data and selection)
 * <MapView 
 *   places={places}
 *   selectedPlace={selectedPlace}
 *   onPlaceSelect={handlePlaceSelect}
 *   onCreateChallenge={handleCreateChallenge}
 * />
 * ```
 */
const MapView = memo(function MapView({
  places: propPlaces,
  onPlaceSelect,
  selectedPlace,
  onCreateChallenge
}: MapViewComponentProps) {
  const { places: contextPlaces, setPlaces } = usePlaces();
  const { loading, error, setLoading, setError, clearError } = useAppState();
  const [localSelectedPlace, setLocalSelectedPlace] = useState<Place | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);

  // Use places from props if provided, otherwise use context places
  const places = propPlaces || contextPlaces;
  const currentSelectedPlace = selectedPlace || localSelectedPlace;

  // Memoize map center calculation for performance
  const mapCenter = useMemo(() => {
    if (places.length === 0) return [51.505, -0.09] as [number, number];

    // Calculate center based on all places
    const avgLat = places.reduce((sum, place) => sum + place.coordinates.lat, 0) / places.length;
    const avgLng = places.reduce((sum, place) => sum + place.coordinates.long, 0) / places.length;

    return [avgLat, avgLng] as [number, number];
  }, [places]);

  // Load places data if not provided via props
  useEffect(() => {
    if (!propPlaces && contextPlaces.length === 0) {
      loadPlaces();
    }
  }, [propPlaces, contextPlaces.length]);

  // OSM Compliance: Set up proper User-Agent and app identification
  useEffect(() => {
    // Set up fetch interceptor for OSM compliance
    const cleanup = setupOSMCompliance();

    // Add app identification to the document for OSM compliance
    const metaAppName = document.querySelector('meta[name="application-name"]');
    if (!metaAppName) {
      const meta = document.createElement('meta');
      meta.name = 'application-name';
      meta.content = 'Foosball Challenge App v0.0.0';
      document.head.appendChild(meta);
    }

    // Cleanup on unmount
    return cleanup;
  }, []);

  const loadPlaces = useCallback(async () => {
    setLoading(true);
    setMapLoading(true);
    clearError();

    try {
      const placesData = await PlacesService.getActivePlaces();
      setPlaces(placesData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError({
        type: 'network',
        message: `Failed to load places: ${errorMessage}. Please check your connection and try again.`,
        retryable: true
      });
    } finally {
      setMapLoading(false);
    }
  }, [setPlaces, setLoading, setError, clearError]);

  const handlePlaceSelect = useCallback((place: Place) => {
    // Toggle selection if clicking the same place, otherwise select the new place
    const newSelectedPlace = currentSelectedPlace?.id === place.id ? null : place;

    if (onPlaceSelect) {
      // When using external place selection handler, always call it with the place
      // The parent component can decide how to handle selection/deselection
      onPlaceSelect(place);
    } else {
      // When managing selection internally, toggle the selection
      setLocalSelectedPlace(newSelectedPlace);
    }
  }, [currentSelectedPlace, onPlaceSelect]);

  const handleMapClick = useCallback(() => {
    if (!onPlaceSelect) {
      setLocalSelectedPlace(null);
    }
  }, [onPlaceSelect]);



  const handleCloseCreateDialog = useCallback(() => {
    setShowCreateDialog(false);
  }, []);

  const handleRetry = useCallback(() => {
    loadPlaces();
  }, [loadPlaces]);

  // Filter active places for display
  const activePlaces = useMemo(() =>
    places.filter(place => place.status === '1'),
    [places]
  );

  if (loading || mapLoading) {
    return (
      <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
        {/* Skeleton for map container */}
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation="wave"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            borderRadius: 1
          }}
        />

        {/* Loading overlay */}
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 2,
          p: 3,
          boxShadow: 2
        }}>
          <CircularProgress size={48} />
          <Typography variant="body1" color="text.secondary">
            Loading places...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert
          severity="error"
          action={
            error.retryable && (
              <Button color="inherit" size="small" onClick={handleRetry}>
                Retry
              </Button>
            )
          }
        >
          {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
        touchZoom={true}
        doubleClickZoom={true}
        dragging={true}
        maxZoom={18}
        minZoom={3}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | <a href="https://www.openstreetmap.org/fixthemap">Report a map issue</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          // OSM compliance: proper tile size and caching behavior
          tileSize={256}
          zoomOffset={0}
          updateWhenIdle={true}
          updateWhenZooming={false}
        />

        <MapEventHandler onMapClick={handleMapClick} />

        {activePlaces.map(place => {
          const isSelected = currentSelectedPlace?.id === place.id;

          return (
            <PlaceMarker
              key={place.id}
              place={place}
              isSelected={isSelected}
              onPlaceSelect={handlePlaceSelect}
              onCreateChallenge={onCreateChallenge || ((selectedPlace) => {
                setLocalSelectedPlace(selectedPlace);
                setShowCreateDialog(true);
              })}
            />
          );
        })}
      </MapContainer>

      {/* Create Challenge Dialog */}
      <Dialog
        open={showCreateDialog}
        onClose={handleCloseCreateDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Challenge</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Create a new foosball challenge at <strong>{currentSelectedPlace?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This feature will be available once the challenge form is implemented.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleCloseCreateDialog}>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default MapView;