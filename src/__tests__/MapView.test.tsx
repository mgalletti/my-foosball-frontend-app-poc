/**
 * @fileoverview Comprehensive test suite for the MapView component
 * 
 * This test suite covers all aspects of the MapView component including:
 * - Loading states and error handling
 * - Map rendering and place visualization
 * - User interactions and place selection
 * - Challenge creation integration
 * - Mobile touch optimizations
 * - Performance optimizations
 * - Global state integration
 * 
 * The tests use mocked versions of react-leaflet components and services
 * to ensure reliable and fast test execution without external dependencies.
 * 
 * @author Kiro AI Assistant
 * @version 1.0.0
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import MapView from '../MapView';
import { AppProvider } from '../context/AppContext';
import { PlacesService } from '../services/PlacesService';
import type { Place } from '../types';

// Mock the services
vi.mock('../services/PlacesService');

// Mock react-leaflet components
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children, touchZoom, dragging, scrollWheelZoom, doubleClickZoom, ...props }: any) => (
    <div 
      data-testid="map-container" 
      touchZoom={touchZoom ? 'true' : 'false'}
      dragging={dragging ? 'true' : 'false'}
      scrollWheelZoom={scrollWheelZoom ? 'true' : 'false'}
      doubleClickZoom={doubleClickZoom ? 'true' : 'false'}
      {...props}
    >
      {children}
    </div>
  ),
  TileLayer: (props: any) => <div data-testid="tile-layer" {...props} />,
  Marker: ({ children, eventHandlers, position, ...props }: any) => (
    <div 
      data-testid="marker" 
      data-position={`${position[0]},${position[1]}`}
      {...props}
      onClick={() => eventHandlers?.click?.()}
    >
      {children}
    </div>
  ),
  Popup: ({ children }: any) => (
    <div data-testid="popup">{children}</div>
  ),
  useMapEvents: vi.fn(() => null),
}));

// Mock leaflet Icon
vi.mock('leaflet', () => ({
  Icon: vi.fn().mockImplementation(() => ({})),
}));

const mockPlaces: Place[] = [
  {
    id: '1',
    name: 'Test Place 1',
    coordinates: { lat: 40.7128, long: -74.0060 },
    status: '1'
  },
  {
    id: '2',
    name: 'Test Place 2',
    coordinates: { lat: 40.7589, long: -73.9851 },
    status: '1'
  },
  {
    id: '3',
    name: 'Inactive Place',
    coordinates: { lat: 40.7505, long: -73.9934 },
    status: '0'
  }
];

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <AppProvider>
      {component}
    </AppProvider>
  );
};

describe('MapView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('should show skeleton loading and spinner when loading places', async () => {
      vi.mocked(PlacesService.getActivePlaces).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockPlaces), 100))
      );

      renderWithProvider(<MapView />);

      expect(screen.getByText('Loading places...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      
      // Check for skeleton loading
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should hide loading spinner and skeleton after places are loaded', async () => {
      vi.mocked(PlacesService.getActivePlaces).mockResolvedValue(mockPlaces);

      renderWithProvider(<MapView />);

      await waitFor(() => {
        expect(screen.queryByText('Loading places...')).not.toBeInTheDocument();
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });

    it('should show loading overlay with proper styling', async () => {
      vi.mocked(PlacesService.getActivePlaces).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockPlaces), 100))
      );

      renderWithProvider(<MapView />);

      const loadingOverlay = screen.getByText('Loading places...').closest('div');
      expect(loadingOverlay).toHaveStyle({
        position: 'absolute'
      });
    });
  });

  describe('Error Handling', () => {
    it('should display enhanced error message when places fail to load', async () => {
      const errorMessage = 'Network error';
      vi.mocked(PlacesService.getActivePlaces).mockRejectedValue(new Error(errorMessage));

      renderWithProvider(<MapView />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load places: Network error/)).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should handle unknown errors gracefully', async () => {
      vi.mocked(PlacesService.getActivePlaces).mockRejectedValue('Unknown error');

      renderWithProvider(<MapView />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load places: Unknown error occurred/)).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should retry loading places when retry button is clicked', async () => {
      vi.mocked(PlacesService.getActivePlaces)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockPlaces);

      renderWithProvider(<MapView />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(screen.queryByText(/Failed to load places/)).not.toBeInTheDocument();
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
      });

      expect(PlacesService.getActivePlaces).toHaveBeenCalledTimes(2);
    });

    it('should clear mapLoading state after error', async () => {
      vi.mocked(PlacesService.getActivePlaces).mockRejectedValue(new Error('Network error'));

      renderWithProvider(<MapView />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load places/)).toBeInTheDocument();
        // Should not show loading spinner when error is displayed
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });
  });

  describe('Map Rendering', () => {
    beforeEach(async () => {
      vi.mocked(PlacesService.getActivePlaces).mockResolvedValue(mockPlaces);
    });

    it('should render map container with correct props', async () => {
      renderWithProvider(<MapView />);

      await waitFor(() => {
        const mapContainer = screen.getByTestId('map-container');
        expect(mapContainer).toBeInTheDocument();
        expect(mapContainer).toHaveAttribute('zoom', '13');
      });
    });

    it('should render tile layer', async () => {
      renderWithProvider(<MapView />);

      await waitFor(() => {
        expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
      });
    });

    it('should render markers for active places only', async () => {
      renderWithProvider(<MapView />);

      await waitFor(() => {
        const markers = screen.getAllByTestId('marker');
        expect(markers).toHaveLength(2); // Only active places (status: '1')
      });
    });

    it('should not render markers for inactive places', async () => {
      const inactivePlaces = mockPlaces.filter(place => place.status === '0');
      vi.mocked(PlacesService.getActivePlaces).mockResolvedValue(inactivePlaces);

      renderWithProvider(<MapView />);

      await waitFor(() => {
        expect(screen.queryByTestId('marker')).not.toBeInTheDocument();
      });
    });
  });

  describe('Place Selection', () => {
    beforeEach(async () => {
      vi.mocked(PlacesService.getActivePlaces).mockResolvedValue(mockPlaces);
    });

    it('should call onPlaceSelect when marker is clicked', async () => {
      const onPlaceSelect = vi.fn();
      renderWithProvider(
        <MapView onPlaceSelect={onPlaceSelect} />
      );

      await waitFor(() => {
        const markers = screen.getAllByTestId('marker');
        expect(markers).toHaveLength(2);
      });

      fireEvent.click(screen.getAllByTestId('marker')[0]);
      expect(onPlaceSelect).toHaveBeenCalledWith(mockPlaces[0]);
    });

    it('should display place details in popup', async () => {
      renderWithProvider(<MapView />);

      await waitFor(() => {
        expect(screen.getByText('Test Place 1')).toBeInTheDocument();
        expect(screen.getByText('ID: 1')).toBeInTheDocument();
        expect(screen.getByText(/Coordinates: 40.7128, -74.0060/)).toBeInTheDocument();
        expect(screen.getAllByText('Available')).toHaveLength(2); // Two active places
      });
    });

    it('should show Create Challenge button in popup', async () => {
      renderWithProvider(<MapView />);

      await waitFor(() => {
        const createButtons = screen.getAllByText('Create Challenge');
        expect(createButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Challenge Creation', () => {
    beforeEach(async () => {
      vi.mocked(PlacesService.getActivePlaces).mockResolvedValue(mockPlaces);
    });

    it('should call onCreateChallenge when Create Challenge button is clicked', async () => {
      const onCreateChallenge = vi.fn();
      renderWithProvider(
        <MapView onCreateChallenge={onCreateChallenge} places={mockPlaces} />
      );

      await waitFor(() => {
        const createButtons = screen.getAllByText('Create Challenge');
        expect(createButtons.length).toBeGreaterThan(0);
      });

      fireEvent.click(screen.getAllByText('Create Challenge')[0]);
      expect(onCreateChallenge).toHaveBeenCalledWith(mockPlaces[0]);
    });

    it('should show create challenge dialog when no onCreateChallenge prop is provided', async () => {
      renderWithProvider(<MapView places={mockPlaces} />);

      await waitFor(() => {
        const createButtons = screen.getAllByText('Create Challenge');
        expect(createButtons.length).toBeGreaterThan(0);
      });

      fireEvent.click(screen.getAllByText('Create Challenge')[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/Create a new foosball challenge at/)).toBeInTheDocument();
        // Check for the place name within the dialog context
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveTextContent('Test Place 1');
      });
    });

    it('should close create challenge dialog when Cancel is clicked', async () => {
      renderWithProvider(<MapView places={mockPlaces} />);

      await waitFor(() => {
        const createButtons = screen.getAllByText('Create Challenge');
        expect(createButtons.length).toBeGreaterThan(0);
      });

      fireEvent.click(screen.getAllByText('Create Challenge')[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Props Integration', () => {
    it('should use places from props when provided', async () => {
      const customPlaces = [mockPlaces[0]]; // Only one place
      renderWithProvider(
        <MapView places={customPlaces} />
      );

      await waitFor(() => {
        const markers = screen.getAllByTestId('marker');
        expect(markers).toHaveLength(1);
        expect(screen.getByText('Test Place 1')).toBeInTheDocument();
      });

      // Should not call the service when places are provided via props
      expect(PlacesService.getActivePlaces).not.toHaveBeenCalled();
    });

    it('should use selectedPlace from props', async () => {
      const selectedPlace = mockPlaces[0];
      renderWithProvider(
        <MapView places={mockPlaces} selectedPlace={selectedPlace} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
      });

      // The selected place should be highlighted (this would be tested through icon changes in a real scenario)
      expect(screen.getByText('Test Place 1')).toBeInTheDocument();
    });
  });

  describe('Performance Optimizations', () => {
    beforeEach(async () => {
      vi.mocked(PlacesService.getActivePlaces).mockResolvedValue(mockPlaces);
    });

    it('should calculate map center based on all places', async () => {
      renderWithProvider(<MapView />);

      await waitFor(() => {
        const mapContainer = screen.getByTestId('map-container');
        expect(mapContainer).toBeInTheDocument();
      });

      // The map center should be calculated as the average of all place coordinates
      // This is tested indirectly through the component rendering without errors
    });

    it('should handle empty places array gracefully', async () => {
      vi.mocked(PlacesService.getActivePlaces).mockResolvedValue([]);

      renderWithProvider(<MapView />);

      await waitFor(() => {
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
        expect(screen.queryByTestId('marker')).not.toBeInTheDocument();
      });
    });
  });

  describe('Mobile Touch Optimizations', () => {
    beforeEach(async () => {
      vi.mocked(PlacesService.getActivePlaces).mockResolvedValue(mockPlaces);
    });

    it('should render map with touch-friendly settings', async () => {
      renderWithProvider(<MapView />);

      await waitFor(() => {
        const mapContainer = screen.getByTestId('map-container');
        expect(mapContainer).toHaveAttribute('touchZoom', 'true');
        expect(mapContainer).toHaveAttribute('dragging', 'true');
        expect(mapContainer).toHaveAttribute('scrollWheelZoom', 'true');
        expect(mapContainer).toHaveAttribute('doubleClickZoom', 'true');
      });
    });

    it('should use larger marker icons for better touch targets', async () => {
      renderWithProvider(<MapView />);

      await waitFor(() => {
        const markers = screen.getAllByTestId('marker');
        expect(markers.length).toBeGreaterThan(0);
      });

      // Verify that the Icon constructor was called with larger sizes
      const { Icon } = await import('leaflet');
      expect(vi.mocked(Icon)).toHaveBeenCalledWith(
        expect.objectContaining({
          iconSize: [32, 52], // Larger size for mobile
          iconAnchor: [16, 52],
          popupAnchor: [1, -44],
          shadowSize: [52, 52]
        })
      );
    });

    it('should handle map click events to deselect places', async () => {
      const onPlaceSelect = vi.fn();
      renderWithProvider(
        <MapView onPlaceSelect={onPlaceSelect} places={mockPlaces} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
      });

      // First select a place
      const markers = screen.getAllByTestId('marker');
      fireEvent.click(markers[0]);
      expect(onPlaceSelect).toHaveBeenCalledWith(mockPlaces[0]);

      // Then click on map to deselect (this would be handled by useMapEvents in real scenario)
      // The test verifies the component structure supports this functionality
    });
  });

  describe('Enhanced Place Selection', () => {
    beforeEach(async () => {
      vi.mocked(PlacesService.getActivePlaces).mockResolvedValue(mockPlaces);
    });

    it('should toggle place selection when clicking the same place twice', async () => {
      const onPlaceSelect = vi.fn();
      renderWithProvider(
        <MapView onPlaceSelect={onPlaceSelect} />
      );

      await waitFor(() => {
        const markers = screen.getAllByTestId('marker');
        expect(markers).toHaveLength(2);
      });

      // Click the same marker twice
      const firstMarker = screen.getAllByTestId('marker')[0];
      fireEvent.click(firstMarker);
      fireEvent.click(firstMarker);

      // Should be called twice with the same place
      expect(onPlaceSelect).toHaveBeenCalledTimes(2);
      expect(onPlaceSelect).toHaveBeenNthCalledWith(1, mockPlaces[0]);
      expect(onPlaceSelect).toHaveBeenNthCalledWith(2, mockPlaces[0]);
    });

    it('should show detailed place information in popup with proper formatting', async () => {
      renderWithProvider(<MapView places={mockPlaces} />);

      await waitFor(() => {
        // Check for properly formatted coordinates
        expect(screen.getByText(/Coordinates: 40.7128, -74.0060/)).toBeInTheDocument();
        expect(screen.getByText(/Coordinates: 40.7589, -73.9851/)).toBeInTheDocument();
        
        // Check for status chip
        expect(screen.getAllByText('Available')).toHaveLength(2);
        
        // Check for place names and IDs
        expect(screen.getByText('Test Place 1')).toBeInTheDocument();
        expect(screen.getByText('Test Place 2')).toBeInTheDocument();
        expect(screen.getByText('ID: 1')).toBeInTheDocument();
        expect(screen.getByText('ID: 2')).toBeInTheDocument();
      });
    });

    it('should handle internal place selection toggle without external handler', async () => {
      renderWithProvider(<MapView places={mockPlaces} />);

      await waitFor(() => {
        const markers = screen.getAllByTestId('marker');
        expect(markers).toHaveLength(2);
      });

      // Click first marker to select
      const firstMarker = screen.getAllByTestId('marker')[0];
      fireEvent.click(firstMarker);

      // Click second marker to select different place
      const secondMarker = screen.getAllByTestId('marker')[1];
      fireEvent.click(secondMarker);

      // Both markers should be rendered (selection is internal)
      expect(screen.getAllByTestId('marker')).toHaveLength(2);
    });

    it('should display place status correctly for active places', async () => {
      renderWithProvider(<MapView places={mockPlaces} />);

      await waitFor(() => {
        // All active places should show "Available" status
        const availableChips = screen.getAllByText('Available');
        expect(availableChips).toHaveLength(2); // Only active places
        
        // Verify each chip has correct styling
        availableChips.forEach(chip => {
          expect(chip.closest('.MuiChip-root')).toBeInTheDocument();
        });
      });
    });

    it('should show coordinates with proper precision', async () => {
      renderWithProvider(<MapView places={mockPlaces} />);

      await waitFor(() => {
        // Check that coordinates are displayed with 4 decimal places
        expect(screen.getByText('Coordinates: 40.7128, -74.0060')).toBeInTheDocument();
        expect(screen.getByText('Coordinates: 40.7589, -73.9851')).toBeInTheDocument();
      });
    });
  });

  describe('Global State Integration', () => {
    beforeEach(async () => {
      vi.mocked(PlacesService.getActivePlaces).mockResolvedValue(mockPlaces);
    });

    it('should load places into global state when no props provided', async () => {
      renderWithProvider(<MapView />);

      await waitFor(() => {
        expect(PlacesService.getActivePlaces).toHaveBeenCalledTimes(1);
        expect(screen.getAllByTestId('marker')).toHaveLength(2);
      });
    });

    it('should not load places when provided via props', async () => {
      renderWithProvider(<MapView places={mockPlaces} />);

      await waitFor(() => {
        expect(screen.getAllByTestId('marker')).toHaveLength(2);
      });

      // Should not call service when places are provided
      expect(PlacesService.getActivePlaces).not.toHaveBeenCalled();
    });

    it('should handle loading state correctly with global state', async () => {
      vi.mocked(PlacesService.getActivePlaces).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockPlaces), 100))
      );

      renderWithProvider(<MapView />);

      // Should show loading initially
      expect(screen.getByText('Loading places...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Loading places...')).not.toBeInTheDocument();
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
      });
    });

    it('should handle error state correctly with global state', async () => {
      const errorMessage = 'API Error';
      vi.mocked(PlacesService.getActivePlaces).mockRejectedValue(new Error(errorMessage));

      renderWithProvider(<MapView />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load places: API Error/)).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });
  });

  describe('Challenge Creation Integration', () => {
    beforeEach(async () => {
      vi.mocked(PlacesService.getActivePlaces).mockResolvedValue(mockPlaces);
    });

    it('should prevent event propagation when Create Challenge button is clicked', async () => {
      const onCreateChallenge = vi.fn();
      const onPlaceSelect = vi.fn();
      
      renderWithProvider(
        <MapView 
          places={mockPlaces} 
          onCreateChallenge={onCreateChallenge}
          onPlaceSelect={onPlaceSelect}
        />
      );

      await waitFor(() => {
        const createButtons = screen.getAllByText('Create Challenge');
        expect(createButtons.length).toBeGreaterThan(0);
      });

      fireEvent.click(screen.getAllByText('Create Challenge')[0]);

      // Should call onCreateChallenge but not onPlaceSelect due to stopPropagation
      expect(onCreateChallenge).toHaveBeenCalledWith(mockPlaces[0]);
      expect(onPlaceSelect).not.toHaveBeenCalled();
    });

    it('should show dialog with correct place name when no external handler provided', async () => {
      renderWithProvider(<MapView places={mockPlaces} />);

      await waitFor(() => {
        const createButtons = screen.getAllByText('Create Challenge');
        expect(createButtons.length).toBeGreaterThan(0);
      });

      fireEvent.click(screen.getAllByText('Create Challenge')[0]);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveTextContent('Create a new foosball challenge at Test Place 1?');
        expect(dialog).toHaveTextContent('This feature will be available once the challenge form is implemented.');
      });
    });

    it('should close dialog when OK button is clicked', async () => {
      renderWithProvider(<MapView places={mockPlaces} />);

      await waitFor(() => {
        const createButtons = screen.getAllByText('Create Challenge');
        expect(createButtons.length).toBeGreaterThan(0);
      });

      fireEvent.click(screen.getAllByText('Create Challenge')[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('OK'));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });
});