/**
 * @fileoverview Simplified tests for PlacesList component
 * 
 * This test suite focuses on core functionality that we can verify works.
 */

import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
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

describe('PlacesList Simple Tests', () => {
  const mockOnPlaceSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search controls', () => {
    render(
      <ThemeProvider theme={theme}>
        <PlacesList places={mockPlaces} onPlaceSelect={mockOnPlaceSelect} />
      </ThemeProvider>
    );

    expect(screen.getByPlaceholderText('Search places by name...')).toBeInTheDocument();
    expect(screen.getByText('All Places')).toBeInTheDocument();
  });

  it('shows results summary', () => {
    render(
      <ThemeProvider theme={theme}>
        <PlacesList places={mockPlaces} onPlaceSelect={mockOnPlaceSelect} />
      </ThemeProvider>
    );

    expect(screen.getByText('2 of 2 places')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(
      <ThemeProvider theme={theme}>
        <PlacesList places={[]} onPlaceSelect={mockOnPlaceSelect} loading={true} />
      </ThemeProvider>
    );

    expect(screen.getByText('Loading places...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const errorMessage = 'Failed to load places';
    render(
      <ThemeProvider theme={theme}>
        <PlacesList places={[]} onPlaceSelect={mockOnPlaceSelect} error={errorMessage} />
      </ThemeProvider>
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(
      <ThemeProvider theme={theme}>
        <PlacesList places={[]} onPlaceSelect={mockOnPlaceSelect} />
      </ThemeProvider>
    );

    expect(screen.getByText('No places available')).toBeInTheDocument();
  });

  it('renders places when provided', () => {
    render(
      <ThemeProvider theme={theme}>
        <PlacesList places={mockPlaces} onPlaceSelect={mockOnPlaceSelect} />
      </ThemeProvider>
    );

    // Check that places are rendered
    expect(screen.getByText('Downtown Sports Bar')).toBeInTheDocument();
    expect(screen.getByText('University Recreation Center')).toBeInTheDocument();
  });
});