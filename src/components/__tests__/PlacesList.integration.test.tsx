/**
 * @fileoverview Integration test for PlacesList component
 * 
 * This test verifies that the PlacesList component renders correctly
 * with basic functionality working.
 */

import { vi } from 'vitest'
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { PlacesList } from '../PlacesList';
import type { Place } from '../../types';

const theme = createTheme();

const mockPlaces: Place[] = [
  {
    id: 'place-1',
    name: 'Downtown Sports Bar',
    coordinates: { lat: 40.7128, long: -74.0060 },
    status: '1'
  },
  {
    id: 'place-2',
    name: 'University Recreation Center',
    coordinates: { lat: 40.7589, long: -73.9851 },
    status: '1'
  }
];

// Mock the context hook to return empty challenges
vi.mock('../../context/AppContext', () => ({
  useChallenges: () => ({
    challenges: [],
    setChallenges: vi.fn(),
    addChallenge: vi.fn(),
    joinChallenge: vi.fn(),
    loading: false,
    error: null
  })
}));

describe('PlacesList Integration Test', () => {
  it('renders places list with search and filter controls', () => {
    const mockOnPlaceSelect = vi.fn();
    
    render(
      <ThemeProvider theme={theme}>
        <PlacesList places={mockPlaces} onPlaceSelect={mockOnPlaceSelect} />
      </ThemeProvider>
    );

    // Check that search input is rendered
    expect(screen.getByPlaceholderText('Search places by name...')).toBeInTheDocument();
    
    // Check that status filter is rendered
    expect(screen.getByText('All Places')).toBeInTheDocument();
    
    // Check that results summary is rendered
    expect(screen.getByText('2 of 2 places')).toBeInTheDocument();
    
    // Check that places are rendered
    expect(screen.getByText('Downtown Sports Bar')).toBeInTheDocument();
    expect(screen.getByText('University Recreation Center')).toBeInTheDocument();
    
    // Check that coordinates are displayed
    expect(screen.getByText('40.7128, -74.0060')).toBeInTheDocument();
    expect(screen.getByText('40.7589, -73.9851')).toBeInTheDocument();
    
    // Check that status chips are displayed
    expect(screen.getAllByText('Active')).toHaveLength(2);
  });

  it('renders empty state when no places provided', () => {
    const mockOnPlaceSelect = vi.fn();
    
    render(
      <ThemeProvider theme={theme}>
        <PlacesList places={[]} onPlaceSelect={mockOnPlaceSelect} />
      </ThemeProvider>
    );

    expect(screen.getByText('No places available')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    const mockOnPlaceSelect = vi.fn();
    
    render(
      <ThemeProvider theme={theme}>
        <PlacesList places={[]} onPlaceSelect={mockOnPlaceSelect} loading={true} />
      </ThemeProvider>
    );

    expect(screen.getByText('Loading places...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const mockOnPlaceSelect = vi.fn();
    const errorMessage = 'Failed to load places';
    
    render(
      <ThemeProvider theme={theme}>
        <PlacesList places={[]} onPlaceSelect={mockOnPlaceSelect} error={errorMessage} />
      </ThemeProvider>
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});