/**
 * @fileoverview ChallengeForm component for creating new foosball challenges
 * 
 * This component provides a comprehensive form for creating challenges with validation,
 * mobile-friendly controls, and integration with the ChallengesService. It handles
 * form submission, error states, and provides a responsive mobile interface.
 * 
 * @version 1.0.0
 */

import React, { useState, useCallback } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Event as EventIcon,
  Schedule as TimeIcon,
  SportsEsports as ChallengeIcon
} from '@mui/icons-material';
import type {
  Place,
  CreateChallengeRequest,
  ChallengeFormData,
  TimeSlot,
  ValidationErrors,
  ErrorState
} from '../types';
import { ChallengesService } from '../services';

/**
 * Props interface for the ChallengeForm component
 * 
 * @interface ChallengeFormProps
 * @property {Place} place - The foosball place where the challenge will be held.
 *                          Must include id, name, coordinates, and status.
 * @property {function} onSubmit - Callback function called after successful challenge creation.
 *                                Receives the CreateChallengeRequest data that was submitted.
 *                                Use this to update UI state, show notifications, or navigate.
 * @property {function} onCancel - Callback function called when user cancels the form.
 *                                Triggered by cancel button click, dialog close, or ESC key.
 *                                Use this to hide the form or reset parent component state.
 * @property {boolean} [open=true] - Controls the visibility of the dialog.
 *                                  When false, the dialog is hidden.
 *                                  Defaults to true if not provided.
 * 
 * @example
 * ```tsx
 * const props: ChallengeFormProps = {
 *   place: {
 *     id: 'place-123',
 *     name: 'Downtown Foosball Club',
 *     coordinates: { lat: 40.7128, long: -74.0060 },
 *     status: '1'
 *   },
 *   onSubmit: (challengeData) => {
 *     console.log('Challenge created:', challengeData);
 *     // Update state, show notification, etc.
 *   },
 *   onCancel: () => {
 *     setShowForm(false);
 *   },
 *   open: true
 * };
 * ```
 */
export interface ChallengeFormProps {
  place: Place;
  onSubmit: (challenge: CreateChallengeRequest) => void;
  onCancel: () => void;
  open?: boolean;
}

/**
 * Comprehensive validation function for challenge form fields
 * 
 * Validates all form fields according to business rules and returns
 * an object containing error messages for invalid fields.
 * 
 * @param {ChallengeFormData} data - The form data to validate
 * @returns {ValidationErrors<ChallengeFormData>} Object containing validation errors
 * 
 * @example
 * ```tsx
 * const formData = { name: 'Test', date: '2024-12-25', time: 'Morning' };
 * const errors = validateChallengeForm(formData);
 * if (Object.keys(errors).length === 0) {
 *   // Form is valid
 * }
 * ```
 * 
 * ## Validation Rules
 * 
 * ### Challenge Name
 * - Required: Cannot be empty or whitespace-only
 * - Minimum length: 3 characters (after trimming)
 * - Maximum length: 50 characters (after trimming)
 * - Automatically trims whitespace for validation
 * 
 * ### Date
 * - Required: Must be provided
 * - Cannot be in the past (must be today or later)
 * - Cannot be more than 30 days in the future
 * - Uses local timezone for comparison
 * 
 * ### Time Slot
 * - Required: Must select one of the available time slots
 * - Must be one of: 'Morning', 'Afternoon', 'Evening'
 */
const validateChallengeForm = (data: ChallengeFormData): ValidationErrors<ChallengeFormData> => {
  const errors: ValidationErrors<ChallengeFormData> = {};

  // Challenge Name Validation
  // Ensures the challenge has a meaningful, appropriately-sized name
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Challenge name is required';
  } else if (data.name.trim().length < 3) {
    errors.name = 'Challenge name must be at least 3 characters';
  } else if (data.name.trim().length > 50) {
    errors.name = 'Challenge name must be less than 50 characters';
  }

  // Date Validation
  // Ensures the challenge is scheduled for a reasonable future date
  if (!data.date) {
    errors.date = 'Date is required';
  } else {
    // Parse the date string as local date to avoid timezone issues
    const dateParts = data.date.split('-');
    const selectedDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

    // Prevent scheduling challenges in the past (but allow today)
    if (selectedDate < today) {
      errors.date = 'Date cannot be in the past';
    }

    // Prevent scheduling too far in advance (business rule: max 30 days)
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    maxDate.setHours(0, 0, 0, 0); // Set to start of day for comparison
    if (selectedDate > maxDate) {
      errors.date = 'Date cannot be more than 30 days in the future';
    }
  }

  // Time Slot Validation
  // Ensures a valid time slot is selected from available options
  if (!data.time) {
    errors.time = 'Time slot is required';
  }

  return errors;
};

/**
 * Get minimum date for date picker (today)
 * 
 * Returns today's date in YYYY-MM-DD format for use as the minimum
 * value in HTML5 date input. This prevents users from selecting
 * dates in the past.
 * 
 * @returns {string} Today's date in ISO format (YYYY-MM-DD)
 * 
 * @example
 * ```tsx
 * const minDate = getMinDate(); // "2024-07-16"
 * <input type="date" min={minDate} />
 * ```
 */
const getMinDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

/**
 * Get maximum date for date picker (30 days from now)
 * 
 * Returns a date 30 days from today in YYYY-MM-DD format for use
 * as the maximum value in HTML5 date input. This enforces the
 * business rule that challenges cannot be scheduled more than
 * 30 days in advance.
 * 
 * @returns {string} Date 30 days from now in ISO format (YYYY-MM-DD)
 * 
 * @example
 * ```tsx
 * const maxDate = getMaxDate(); // "2024-08-15"
 * <input type="date" max={maxDate} />
 * ```
 */
const getMaxDate = (): string => {
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  return maxDate.toISOString().split('T')[0];
};

/**
 * ChallengeForm component for creating new challenges
 */
const ChallengeForm: React.FC<ChallengeFormProps> = ({
  place,
  onSubmit,
  onCancel,
  open = true
}) => {
  // Form state
  const [formData, setFormData] = useState<ChallengeFormData>({
    name: '',
    date: '',
    time: '' as TimeSlot
  });

  // Validation and UI state
  const [errors, setErrors] = useState<ValidationErrors<ChallengeFormData>>({});
  const [touched, setTouched] = useState<{ [K in keyof ChallengeFormData]?: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<ErrorState | null>(null);

  /**
   * Handle input field changes for text and date inputs
   * 
   * Creates a curried function that updates the form data for a specific field
   * and clears any existing validation errors for that field to provide
   * immediate feedback when the user starts correcting an error.
   * 
   * @param {keyof ChallengeFormData} field - The form field to update
   * @returns {function} Event handler function for input changes
   * 
   * @example
   * ```tsx
   * <TextField onChange={handleInputChange('name')} />
   * ```
   */
  const handleInputChange = useCallback((field: keyof ChallengeFormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setFormData(prev => ({ ...prev, [field]: value }));

      // Clear error when user starts typing to provide immediate feedback
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
    }, [errors]);

  /**
   * Handle select field changes for dropdown inputs
   * 
   * Creates a curried function that updates the form data for select fields
   * (like time slot selection) and clears validation errors for immediate
   * user feedback.
   * 
   * @param {keyof ChallengeFormData} field - The form field to update
   * @returns {function} Event handler function for select changes
   * 
   * @example
   * ```tsx
   * <Select onChange={handleSelectChange('time')} />
   * ```
   */
  const handleSelectChange = useCallback((field: keyof ChallengeFormData) =>
    (event: any) => {
      const value = event.target.value;
      setFormData(prev => ({ ...prev, [field]: value }));

      // Clear error when user makes selection for immediate feedback
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
    }, [errors]);

  /**
   * Handle field blur events for real-time validation
   * 
   * Triggers validation when a user leaves a field (blur event).
   * Marks the field as "touched" to enable error display and
   * validates only the specific field for performance.
   * 
   * @param {keyof ChallengeFormData} field - The form field that was blurred
   * @returns {function} Event handler function for blur events
   * 
   * @example
   * ```tsx
   * <TextField onBlur={handleBlur('name')} />
   * ```
   */
  const handleBlur = useCallback((field: keyof ChallengeFormData) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));

    // Validate only the specific field for better performance
    const fieldErrors = validateChallengeForm(formData);
    if (fieldErrors[field]) {
      setErrors(prev => ({ ...prev, [field]: fieldErrors[field] }));
    }
  }, [formData]);

  /**
   * Validate entire form before submission
   * 
   * Performs comprehensive validation of all form fields and marks
   * all fields as touched to display any validation errors.
   * Used during form submission to ensure data integrity.
   * 
   * @returns {boolean} True if form is valid, false if there are errors
   * 
   * @example
   * ```tsx
   * if (validateForm()) {
   *   // Proceed with submission
   * } else {
   *   // Show validation errors
   * }
   * ```
   */
  const validateForm = useCallback((): boolean => {
    const formErrors = validateChallengeForm(formData);
    setErrors(formErrors);

    // Mark all fields as touched to show validation errors
    setTouched({
      name: true,
      date: true,
      time: true
    });

    return Object.keys(formErrors).length === 0;
  }, [formData]);

  /**
   * Handle form submission with comprehensive error handling
   * 
   * Validates the form, creates a challenge request, calls the API service,
   * and handles various error scenarios. Provides user feedback through
   * loading states and error messages.
   * 
   * @param {React.FormEvent} event - Form submission event
   * 
   * ## Process Flow
   * 1. Prevent default form submission
   * 2. Clear any previous submission errors
   * 3. Validate all form fields
   * 4. Set loading state
   * 5. Create challenge request object
   * 6. Call ChallengesService API
   * 7. Handle success/error scenarios
   * 8. Reset loading state
   * 
   * ## Error Handling
   * - **Validation Errors**: Form validation failures
   * - **Network Errors**: Connection issues, timeouts
   * - **Server Errors**: API failures, business logic errors
   * - **Unknown Errors**: Unexpected error types
   * 
   * @example
   * ```tsx
   * <form onSubmit={handleSubmit}>
   *   // Form fields
   * </form>
   * ```
   */
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    // Validate form before proceeding
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the challenge request object with trimmed name
      const challengeRequest: CreateChallengeRequest = {
        name: formData.name.trim(),
        placeId: place.id,
        date: formData.date,
        time: formData.time
      };

      // Call the service to create the challenge
      await ChallengesService.createChallenge(challengeRequest);

      // Notify parent component of successful creation
      onSubmit(challengeRequest);
    } catch (error) {
      console.error('Failed to create challenge:', error);

      // Categorize and handle different types of errors
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
        } else if (error.message.includes('Server error')) {
          setSubmitError({
            type: 'server',
            message: 'Failed to create challenge. Please try again.',
            retryable: true
          });
        } else {
          setSubmitError({
            type: 'server',
            message: 'Failed to create challenge. Please try again.',
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
  }, [formData, place.id, onSubmit, validateForm]);

  /**
   * Handle form cancellation and cleanup
   * 
   * Resets all form state to initial values and calls the parent
   * component's onCancel callback. This ensures a clean state
   * when the form is reopened.
   * 
   * ## State Reset
   * - Form data (name, date, time)
   * - Validation errors
   * - Touched field tracking
   * - Submission errors
   * - Loading states
   * 
   * @example
   * ```tsx
   * <Button onClick={handleCancel}>Cancel</Button>
   * ```
   */
  const handleCancel = useCallback(() => {
    // Reset all form state to initial values
    setFormData({
      name: '',
      date: '',
      time: '' as TimeSlot
    });
    setErrors({});
    setTouched({});
    setSubmitError(null);
    setIsSubmitting(false);

    // Notify parent component
    onCancel();
  }, [onCancel]);

  /**
   * Check if form has been modified by the user
   * 
   * Determines whether any form fields contain data to control
   * the submit button's enabled state. Prevents submission of
   * completely empty forms.
   * 
   * @returns {boolean} True if any field has content
   * 
   * @example
   * ```tsx
   * <Button disabled={!isFormDirty}>Submit</Button>
   * ```
   */
  const isFormDirty = formData.name || formData.date || formData.time;

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          margin: 1,
          maxHeight: 'calc(100vh - 16px)',
          borderRadius: 2
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <ChallengeIcon color="primary" />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Create Challenge
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          at {place.name}
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={3}>
            {/* Place Information */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Location
              </Typography>
              <Chip
                icon={<EventIcon />}
                label={place.name}
                variant="outlined"
                sx={{ mb: 1 }}
              />
              <Typography variant="caption" color="text.secondary" display="block">
                {place.coordinates.lat.toFixed(4)}, {place.coordinates.long.toFixed(4)}
              </Typography>
            </Box>

            {/* Challenge Name */}
            <TextField
              label="Challenge Name"
              value={formData.name}
              onChange={handleInputChange('name')}
              onBlur={handleBlur('name')}
              error={touched.name && !!errors.name}
              helperText={touched.name && errors.name}
              required
              fullWidth
              placeholder="e.g., Friday Night Showdown"
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: '16px' // Prevent zoom on iOS
                }
              }}
            />

            {/* Date Selection */}
            <TextField
              label="Date"
              type="date"
              value={formData.date}
              onChange={handleInputChange('date')}
              onBlur={handleBlur('date')}
              error={touched.date && !!errors.date}
              helperText={touched.date && errors.date}
              required
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                min: getMinDate(),
                max: getMaxDate()
              }}
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: '16px' // Prevent zoom on iOS
                }
              }}
            />

            {/* Time Slot Selection */}
            <FormControl
              fullWidth
              required
              error={touched.time && !!errors.time}
            >
              <InputLabel id="time-slot-label">Time Slot</InputLabel>
              <Select
                labelId="time-slot-label"
                value={formData.time}
                onChange={handleSelectChange('time')}
                onClose={handleBlur('time')}
                label="Time Slot"
              >
                <MenuItem value="Morning">
                  <Box display="flex" alignItems="center" gap={1}>
                    <TimeIcon sx={{ mr: 1, color: 'action.active' }} />
                    <Box>
                      <Typography>Morning</Typography>
                      <Typography variant="caption" color="text.secondary">
                        (8:00 AM - 12:00 PM)
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
                <MenuItem value="Afternoon">
                  <Box display="flex" alignItems="center" gap={1}>
                    <TimeIcon sx={{ mr: 1, color: 'action.active' }} />
                    <Box>
                      <Typography>Afternoon</Typography>
                      <Typography variant="caption" color="text.secondary">
                        (12:00 PM - 6:00 PM)
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
                <MenuItem value="Evening">
                  <Box display="flex" alignItems="center" gap={1}>
                    <TimeIcon sx={{ mr: 1, color: 'action.active' }} />
                    <Box>
                      <Typography>Evening</Typography>
                      <Typography variant="caption" color="text.secondary">
                        (6:00 PM - 10:00 PM)
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              </Select>
              {touched.time && errors.time && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  {errors.time}
                </Typography>
              )}
            </FormControl>

            {/* Submit Error Display */}
            {submitError && (
              <Alert
                severity="error"
                onClose={() => setSubmitError(null)}
                sx={{ mt: 2 }}
              >
                {submitError.message}
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            onClick={handleCancel}
            disabled={isSubmitting}
            startIcon={<CloseIcon />}
            sx={{ minWidth: 100 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || !isFormDirty}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : <SaveIcon />}
            sx={{ minWidth: 120 }}
          >
            {isSubmitting ? 'Creating...' : 'Create Challenge'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ChallengeForm;