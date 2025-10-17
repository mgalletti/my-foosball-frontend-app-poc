/**
 * @fileoverview PlayerProfile component for displaying and editing player information
 * 
 * This component provides a comprehensive interface for viewing and editing player profiles.
 * It displays player ID, name, expertise level, and points, with editing functionality
 * for updatable fields. The component includes validation, error handling, and a
 * mobile-optimized interface.
 * 
 * @version 1.0.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Stack,
  Chip,
  Avatar,
  Divider,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import type {
  Player,
  UpdatePlayerRequest,
  PlayerProfileFormData,
  ValidationErrors,
  ErrorState
} from '../types';
import { PlayersService } from '../services';
import { usePlayer } from '../context/AppContext';

/**
 * Props interface for the PlayerProfile component
 * 
 * @interface PlayerProfileProps
 * @property {Player} player - The player object containing id, name, expertise, and points.
 *                            This is the player data to display and potentially edit.
 * @property {function} onUpdateProfile - Callback function called after successful profile update.
 *                                       Receives the updated player data.
 *                                       Use this to update parent state or show notifications.
 * @property {boolean} [editable=true] - Whether the profile can be edited.
 *                                      When false, the component is read-only.
 *                                      Defaults to true if not provided.
 * @property {boolean} [showActions=true] - Whether to show action buttons (edit, save, cancel).
 *                                         When false, hides all action buttons.
 *                                         Defaults to true if not provided.
 * 
 * @example
 * ```tsx
 * const props: PlayerProfileProps = {
 *   player: {
 *     id: 'player-123',
 *     name: 'John Doe',
 *     expertise: 'Intermediate',
 *     points: 150
 *   },
 *   onUpdateProfile: (updatedPlayer) => {
 *     console.log('Profile updated:', updatedPlayer);
 *     // Update global state, show notification, etc.
 *   },
 *   editable: true,
 *   showActions: true
 * };
 * ```
 */
export interface PlayerProfileProps {
  player: Player;
  onUpdateProfile: (updates: Partial<Player>) => void;
  editable?: boolean;
  showActions?: boolean;
}

/**
 * Validation function for player profile form fields
 * 
 * Validates the editable fields (name and expertise) according to business rules
 * and returns an object containing error messages for invalid fields.
 * 
 * @param {PlayerProfileFormData} data - The form data to validate
 * @returns {ValidationErrors<PlayerProfileFormData>} Object containing validation errors
 * 
 * @example
 * ```tsx
 * const formData = { name: 'John', expertise: 'Expert' };
 * const errors = validatePlayerProfile(formData);
 * if (Object.keys(errors).length === 0) {
 *   // Form is valid
 * }
 * ```
 * 
 * ## Validation Rules
 * 
 * ### Player Name
 * - Required: Cannot be empty or whitespace-only
 * - Minimum length: 2 characters (after trimming)
 * - Maximum length: 30 characters (after trimming)
 * - Pattern: Only letters, numbers, spaces, hyphens, and underscores allowed
 * - Automatically trims whitespace for validation
 * 
 * ### Expertise Level
 * - Required: Must select one of the available expertise levels
 * - Must be one of: 'Novice', 'Intermediate', 'Expert'
 */
const validatePlayerProfile = (data: PlayerProfileFormData): ValidationErrors<PlayerProfileFormData> => {
  const errors: ValidationErrors<PlayerProfileFormData> = {};

  // Player Name Validation
  // Ensures the player has a valid, appropriately-sized name
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Name is required';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  } else if (data.name.trim().length > 30) {
    errors.name = 'Name must be less than 30 characters';
  } else {
    // Check for valid characters (letters, numbers, spaces, hyphens, underscores)
    const namePattern = /^[a-zA-Z0-9\s\-_]+$/;
    if (!namePattern.test(data.name.trim())) {
      errors.name = 'Name can only contain letters, numbers, spaces, hyphens, and underscores';
    }
  }

  // Expertise Level Validation
  // Ensures a valid expertise level is selected
  if (!data.expertise) {
    errors.expertise = 'Expertise level is required';
  } else if (!['Novice', 'Intermediate', 'Expert'].includes(data.expertise)) {
    errors.expertise = 'Invalid expertise level';
  }

  return errors;
};

/**
 * Get expertise level color for visual representation
 * 
 * Returns a Material-UI color based on the expertise level for consistent
 * visual representation throughout the application.
 * 
 * @param {Player['expertise']} expertise - The expertise level
 * @returns {string} Material-UI color name
 */
const getExpertiseColor = (expertise: Player['expertise']): 'default' | 'primary' | 'secondary' | 'success' => {
  switch (expertise) {
    case 'Novice':
      return 'default';
    case 'Intermediate':
      return 'primary';
    case 'Expert':
      return 'success';
    default:
      return 'default';
  }
};

/**
 * Get star rating based on expertise level
 * 
 * Returns the number of stars to display for the expertise level.
 * 
 * @param {Player['expertise']} expertise - The expertise level
 * @returns {number} Number of stars (1-3)
 */
const getExpertiseStars = (expertise: Player['expertise']): number => {
  switch (expertise) {
    case 'Novice':
      return 1;
    case 'Intermediate':
      return 2;
    case 'Expert':
      return 3;
    default:
      return 1;
  }
};

/**
 * PlayerProfile component for displaying and editing player information
 */
const PlayerProfile: React.FC<PlayerProfileProps> = ({
  player,
  onUpdateProfile,
  editable = true,
  showActions = true
}) => {
  // Global state hooks
  const { updatePlayer } = usePlayer();

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form state
  const [formData, setFormData] = useState<PlayerProfileFormData>({
    name: player.name,
    expertise: player.expertise
  });

  // Validation and error state
  const [errors, setErrors] = useState<ValidationErrors<PlayerProfileFormData>>({});
  const [touched, setTouched] = useState<{ [K in keyof PlayerProfileFormData]?: boolean }>({});
  const [submitError, setSubmitError] = useState<ErrorState | null>(null);

  // Update form data when player prop changes
  useEffect(() => {
    setFormData({
      name: player.name,
      expertise: player.expertise
    });
  }, [player]);

  /**
   * Handle input field changes
   * 
   * Updates form data and clears validation errors for immediate feedback.
   */
  const handleInputChange = useCallback((field: keyof PlayerProfileFormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setFormData(prev => ({ ...prev, [field]: value }));

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
    }, [errors]);

  /**
   * Handle select field changes
   */
  const handleSelectChange = useCallback((field: keyof PlayerProfileFormData) =>
    (event: any) => {
      const value = event.target.value;
      setFormData(prev => ({ ...prev, [field]: value }));

      // Clear error when user makes selection
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
    }, [errors]);

  /**
   * Handle field blur events for validation
   */
  const handleBlur = useCallback((field: keyof PlayerProfileFormData) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));

    // Validate only the specific field
    const fieldErrors = validatePlayerProfile(formData);
    if (fieldErrors[field]) {
      setErrors(prev => ({ ...prev, [field]: fieldErrors[field] }));
    }
  }, [formData]);

  /**
   * Validate entire form
   */
  const validateForm = useCallback((): boolean => {
    const formErrors = validatePlayerProfile(formData);
    setErrors(formErrors);

    // Mark all fields as touched
    setTouched({
      name: true,
      expertise: true
    });

    return Object.keys(formErrors).length === 0;
  }, [formData]);

  /**
   * Handle edit mode toggle
   */
  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setSubmitError(null);
    setErrors({});
    setTouched({});
  }, []);

  /**
   * Handle edit cancellation
   */
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setFormData({
      name: player.name,
      expertise: player.expertise
    });
    setErrors({});
    setTouched({});
    setSubmitError(null);
  }, [player]);

  /**
   * Handle profile update submission
   */
  const handleSubmit = useCallback(async () => {
    setSubmitError(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create update request with only changed fields
      const updates: UpdatePlayerRequest = {};
      
      if (formData.name.trim() !== player.name) {
        updates.name = formData.name.trim();
      }
      
      if (formData.expertise !== player.expertise) {
        updates.expertise = formData.expertise;
      }

      // Only make API call if there are actual changes
      if (Object.keys(updates).length === 0) {
        setIsEditing(false);
        return;
      }

      // Call API to update player
      const updatedPlayer = await PlayersService.updatePlayer(updates);

      // Update global state
      updatePlayer(updatedPlayer);

      // Notify parent component
      onUpdateProfile(updatedPlayer);

      // Exit edit mode
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update player profile:', error);

      // Handle different error types
      if (error instanceof Error) {
        if (error.message.includes('validation') || error.message.includes('required')) {
          setSubmitError({
            type: 'validation',
            message: error.message,
            retryable: false
          });
        } else if (error.message.includes('Network error')) {
          setSubmitError({
            type: 'network',
            message: 'Network error. Please check your connection and try again.',
            retryable: true
          });
        } else {
          setSubmitError({
            type: 'server',
            message: 'Failed to update profile. Please try again.',
            retryable: true
          });
        }
      } else {
        setSubmitError({
          type: 'unknown',
          message: 'An unexpected error occurred. Please try again.',
          retryable: true
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, player, updatePlayer, onUpdateProfile, validateForm]);

  /**
   * Handle profile refresh
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setSubmitError(null);

    try {
      const refreshedPlayer = await PlayersService.getCurrentPlayer();
      updatePlayer(refreshedPlayer);
      onUpdateProfile(refreshedPlayer);
    } catch (error) {
      console.error('Failed to refresh player profile:', error);
      setSubmitError({
        type: 'network',
        message: 'Failed to refresh profile. Please try again.',
        retryable: true
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [updatePlayer, onUpdateProfile]);

  /**
   * Check if form has changes
   */
  const hasChanges = formData.name.trim() !== player.name || formData.expertise !== player.expertise;

  /**
   * Check if form is valid
   */
  const isFormValid = Object.keys(validatePlayerProfile(formData)).length === 0;

  /**
   * Render star rating for expertise
   */
  const renderStarRating = (expertise: Player['expertise']) => {
    const stars = getExpertiseStars(expertise);
    return (
      <Box display="flex" alignItems="center" gap={0.5}>
        {[1, 2, 3].map((star) => (
          star <= stars ? (
            <StarIcon key={star} sx={{ fontSize: 16, color: 'gold' }} />
          ) : (
            <StarBorderIcon key={star} sx={{ fontSize: 16, color: 'action.disabled' }} />
          )
        ))}
      </Box>
    );
  };

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
      <CardContent>
        <Stack spacing={3}>
          {/* Header with Avatar and Basic Info */}
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: getExpertiseColor(player.expertise) + '.main',
                fontSize: '1.5rem'
              }}
            >
              <PersonIcon />
            </Avatar>
            <Box flex={1}>
              <Typography variant="h5" component="h2" gutterBottom>
                {isEditing ? (
                  <TextField
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    onBlur={handleBlur('name')}
                    error={touched.name && !!errors.name}
                    helperText={touched.name && errors.name}
                    size="small"
                    fullWidth
                    sx={{
                      '& .MuiInputBase-input': {
                        fontSize: '1.5rem',
                        fontWeight: 500
                      }
                    }}
                  />
                ) : (
                  player.name
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Player ID: {player.id}
              </Typography>
            </Box>
            {showActions && !isEditing && (
              <Box>
                <IconButton
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  size="small"
                  title="Refresh profile"
                >
                  {isRefreshing ? (
                    <CircularProgress size={20} />
                  ) : (
                    <RefreshIcon />
                  )}
                </IconButton>
              </Box>
            )}
          </Box>

          <Divider />

          {/* Expertise Level */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Expertise Level
            </Typography>
            {isEditing ? (
              <FormControl
                fullWidth
                size="small"
                error={touched.expertise && !!errors.expertise}
              >
                <InputLabel>Expertise Level</InputLabel>
                <Select
                  value={formData.expertise}
                  onChange={handleSelectChange('expertise')}
                  onClose={handleBlur('expertise')}
                  label="Expertise Level"
                >
                  <MenuItem value="Novice">
                    <Box display="flex" alignItems="center" gap={1}>
                      {renderStarRating('Novice')}
                      <Typography>Novice</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="Intermediate">
                    <Box display="flex" alignItems="center" gap={1}>
                      {renderStarRating('Intermediate')}
                      <Typography>Intermediate</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="Expert">
                    <Box display="flex" alignItems="center" gap={1}>
                      {renderStarRating('Expert')}
                      <Typography>Expert</Typography>
                    </Box>
                  </MenuItem>
                </Select>
                {touched.expertise && errors.expertise && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                    {errors.expertise}
                  </Typography>
                )}
              </FormControl>
            ) : (
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  label={player.expertise}
                  color={getExpertiseColor(player.expertise)}
                  size="small"
                />
                {renderStarRating(player.expertise)}
              </Box>
            )}
          </Box>

          {/* Points */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Points
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <TrophyIcon color="warning" />
              <Typography variant="h6" color="primary">
                {player.points.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                points
              </Typography>
            </Box>
          </Box>

          {/* Error Display */}
          <Collapse in={!!submitError}>
            {submitError && (
              <Alert
                severity="error"
                onClose={() => setSubmitError(null)}
                action={
                  submitError.retryable ? (
                    <Button
                      color="inherit"
                      size="small"
                      onClick={isEditing ? handleSubmit : handleRefresh}
                      disabled={isSubmitting || isRefreshing}
                    >
                      Retry
                    </Button>
                  ) : undefined
                }
              >
                {submitError.message}
              </Alert>
            )}
          </Collapse>
        </Stack>
      </CardContent>

      {/* Action Buttons */}
      {showActions && editable && (
        <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
          {isEditing ? (
            <Stack direction="row" spacing={1}>
              <Button
                onClick={handleCancel}
                disabled={isSubmitting}
                startIcon={<CancelIcon />}
                size="small"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                variant="contained"
                disabled={isSubmitting || !hasChanges || !isFormValid}
                startIcon={isSubmitting ? <CircularProgress size={16} /> : <SaveIcon />}
                size="small"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </Stack>
          ) : (
            <Button
              onClick={handleEdit}
              startIcon={<EditIcon />}
              size="small"
            >
              Edit Profile
            </Button>
          )}
        </CardActions>
      )}
    </Card>
  );
};

export default PlayerProfile;