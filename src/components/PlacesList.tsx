/**
 * @fileoverview PlacesList component for displaying and managing foosball places
 * 
 * This component provides a comprehensive list view of all available foosball places
 * with search, filtering, and detailed information display capabilities. It integrates
 * with the global state to show active challenges count for each place.
 * 
 * @version 1.0.0
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  TextField,
  InputAdornment,
  Typography,
  Chip,
  Card,
  CardContent,
  Collapse,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  Paper,
  Stack,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FilterList as FilterIcon,
  SportsEsports as ChallengeIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material';
import type { Place, Challenge } from '../types';
import { useChallenges } from '../context/AppContext';

/**
 * Props interface for the PlacesList component
 */
export interface PlacesListProps {
  /** Array of places to display */
  places: Place[];
  /** Callback function when a place is selected */
  onPlaceSelect: (place: Place) => void;
  /** Currently selected place (optional) */
  selectedPlace?: Place;
  /** Loading state for places data */
  loading?: boolean;
  /** Error message to display */
  error?: string;
}

/**
 * Filter options for place status
 */
type StatusFilter = 'all' | 'active' | 'inactive';

/**
 * PlacesList component for displaying foosball places with search and filtering
 * 
 * Features:
 * - Search places by name
 * - Filter by status (active/inactive)
 * - Display active challenges count
 * - Expandable place details
 * - Mobile-responsive design
 * - Loading and error states
 * 
 * @param props - Component props
 * @returns JSX element containing the places list
 */
export function PlacesList({
  places,
  onPlaceSelect,
  selectedPlace,
  loading = false,
  error
}: PlacesListProps) {
  // Local state for search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedPlace, setExpandedPlace] = useState<string | null>(null);

  // Get challenges from global state to count active challenges per place
  const { challenges } = useChallenges();

  /**
   * Get count of active (Open) challenges for a specific place
   */
  const getActiveChallengesCount = (placeId: string): number => {
    return challenges.filter(
      challenge => challenge?.place?.id === placeId && challenge.status === 'Open'
    ).length;
  };

  /**
   * Get active challenges for a specific place
   */
  const getActiveChallenges = (placeId: string): Challenge[] => {
    return challenges.filter(
      challenge => challenge?.place?.id === placeId && challenge.status === 'Open'
    );
  };

  /**
   * Check if a place is active (status "1")
   */
  const isPlaceActive = (place: Place): boolean => {
    return place.status === '1';
  };

  /**
   * Filter and search places based on current criteria
   */
  const filteredPlaces = useMemo(() => {
    let filtered = places;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(place =>
        place.name.toLowerCase().includes(searchLower) ||
        place.id.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(place => {
        const active = isPlaceActive(place);
        return statusFilter === 'active' ? active : !active;
      });
    }

    // Sort by name for consistent ordering
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [places, searchTerm, statusFilter]);

  /**
   * Handle place selection and expansion
   */
  const handlePlaceClick = (place: Place) => {
    // Toggle expansion for the clicked place
    setExpandedPlace(expandedPlace === place.id ? null : place.id);
    // Notify parent component of selection
    onPlaceSelect(place);
  };

  /**
   * Handle search input changes
   */
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  /**
   * Handle status filter changes
   */
  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value as StatusFilter);
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  /**
   * Format coordinates for display
   */
  const formatCoordinates = (lat: number, long: number): string => {
    return `${lat.toFixed(4)}, ${long.toFixed(4)}`;
  };

  // Show loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Loading places...
        </Typography>
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {/* Search and Filter Controls */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Stack spacing={2}>
          {/* Search Field */}
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search places by name..."
            value={searchTerm}
            onChange={handleSearchChange}
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }
            }}
          />

          {/* Filter Controls */}
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={handleStatusFilterChange}
              >
                <MenuItem value="all">All Places</MenuItem>
                <MenuItem value="active">Active Only</MenuItem>
                <MenuItem value="inactive">Inactive Only</MenuItem>
              </Select>
            </FormControl>



            {(searchTerm || statusFilter !== 'all') && (
              <Typography
                variant="body2"
                color="primary"
                sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={clearFilters}
              >
                Clear Filters
              </Typography>
            )}
          </Box>

          {/* Results Summary */}
          <Typography variant="body2" color="text.secondary">
            {filteredPlaces.length} of {places.length} places
            {searchTerm && ` matching "${searchTerm}"`}
          </Typography>
        </Stack>
      </Paper>
      {/* Places List */}
      {filteredPlaces.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            {searchTerm || statusFilter !== 'all'
              ? 'No places match your search criteria'
              : 'No places available'
            }
          </Typography>
          {(searchTerm || statusFilter !== 'all') && (
            <Typography
              variant="body2"
              color="primary"
              sx={{ cursor: 'pointer', textDecoration: 'underline', mt: 1 }}
              onClick={clearFilters}
            >
              Clear filters to see all places
            </Typography>
          )}
        </Paper>
      ) : (
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {filteredPlaces.map((place, index) => {
            const isActive = isPlaceActive(place);
            const activeChallengesCount = getActiveChallengesCount(place.id);
            const activeChallenges = getActiveChallenges(place.id);
            const isExpanded = expandedPlace === place.id;
            const isSelected = selectedPlace?.id === place.id;

            return (
              <React.Fragment key={place.id}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => handlePlaceClick(place)}
                    selected={isSelected}
                    sx={{
                      minHeight: 72,
                      '&.Mui-selected': {
                        backgroundColor: 'action.selected',
                      },
                    }}
                  >
                    <ListItemIcon>
                      <Badge
                        badgeContent={activeChallengesCount}
                        color="primary"
                        invisible={activeChallengesCount === 0}
                      >
                        <LocationIcon color={isActive ? 'primary' : 'disabled'} />
                      </Badge>
                    </ListItemIcon>

                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1" component="span">
                            {place.name}
                          </Typography>
                          <Chip
                            icon={isActive ? <ActiveIcon /> : <InactiveIcon />}
                            label={isActive ? 'Active' : 'Inactive'}
                            size="small"
                            color={isActive ? 'success' : 'default'}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {formatCoordinates(place.coordinates.lat, place.coordinates.long)}
                          </Typography>
                          {activeChallengesCount > 0 && (
                            <Typography variant="body2" color="primary">
                              {activeChallengesCount} active challenge{activeChallengesCount !== 1 ? 's' : ''}
                            </Typography>
                          )}
                        </Box>
                      }
                    />

                    <IconButton edge="end" size="small">
                      {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </ListItemButton>
                </ListItem>

                {/* Expanded Details */}
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <Card variant="outlined" sx={{ mx: 2, mb: 1 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Place Details
                      </Typography>

                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Place ID
                          </Typography>
                          <Typography variant="body1">
                            {place.id}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Coordinates
                          </Typography>
                          <Typography variant="body1">
                            Latitude: {place.coordinates.lat}
                          </Typography>
                          <Typography variant="body1">
                            Longitude: {place.coordinates.long}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Status
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            {isActive ? <ActiveIcon color="success" /> : <InactiveIcon color="disabled" />}
                            <Typography variant="body1">
                              {isActive ? 'Active' : 'Inactive'}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Active Challenges */}
                        {activeChallenges.length > 0 && (
                          <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Active Challenges ({activeChallenges.length})
                            </Typography>
                            <Stack spacing={1}>
                              {activeChallenges.map((challenge) => (
                                <Card key={challenge.id} variant="outlined">
                                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                      <ChallengeIcon fontSize="small" color="primary" />
                                      <Typography variant="subtitle2">
                                        {challenge.name}
                                      </Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">
                                      {new Date(challenge.date).toLocaleDateString()} • {challenge.time}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Owner: {challenge.owner.name} • {challenge.players.length} player{challenge.players.length !== 1 ? 's' : ''}
                                    </Typography>
                                  </CardContent>
                                </Card>
                              ))}
                            </Stack>
                          </Box>
                        )}

                        {activeChallenges.length === 0 && (
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              No active challenges at this location
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Collapse>

                {index < filteredPlaces.length - 1 && <Divider />}
              </React.Fragment>
            );
          })}
        </List>
      )}
    </Box>
  );
}

export default PlacesList;