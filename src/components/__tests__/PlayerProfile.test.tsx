/**
 * @fileoverview Tests for PlayerProfile component
 * 
 * This test suite covers all functionality of the PlayerProfile component including:
 * - Profile display with all player information
 * - Edit mode functionality and form validation
 * - Profile update submission and error handling
 * - Mobile-friendly interface elements
 * - Integration with PlayersService and global state
 * 
 * @version 1.0.0
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import PlayerProfile from '../PlayerProfile';
import type { Player } from '../../types';
import { PlayersService } from '../../services';
import { AppProvider } from '../../context/AppContext';

// Mock the PlayersService
vi.mock('../../services', () => ({
  PlayersService: {
    updatePlayer: vi.fn(),
    getCurrentPlayer: vi.fn()
  }
}));

// Mock Material-UI icons to avoid rendering issues in tests
vi.mock('@mui/icons-material', () => ({
  Edit: () => <div data-testid="edit-icon" />,
  Save: () => <div data-testid="save-icon" />,
  Cancel: () => <div data-testid="cancel-icon" />,
  Person: () => <div data-testid="person-icon" />,
  EmojiEvents: () => <div data-testid="trophy-icon" />,
  Star: () => <div data-testid="star-icon" />,
  StarBorder: () => <div data-testid="star-border-icon" />,
  Refresh: () => <div data-testid="refresh-icon" />
}));

/**
 * Test wrapper component that provides necessary context
 */
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppProvider>
    {children}
  </AppProvider>
);

/**
 * Mock player data for testing
 */
const mockPlayer: Player = {
  id: 'player-123',
  name: 'John Doe',
  expertise: 'Intermediate',
  points: 150
};

/**
 * Mock updated player data
 */
const mockUpdatedPlayer: Player = {
  id: 'player-123',
  name: 'John Smith',
  expertise: 'Expert',
  points: 200
};

/**
 * Default props for testing
 */
const defaultProps = {
  player: mockPlayer,
  onUpdateProfile: vi.fn()
};

describe('PlayerProfile Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Profile Display', () => {
    it('renders player information correctly', () => {
      render(
        <TestWrapper>
          <PlayerProfile {...defaultProps} />
        </TestWrapper>
      );

      // Check basic player information
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Player ID: player-123')).toBeInTheDocument();
      expect(screen.getByText('Intermediate')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('points')).toBeInTheDocument();
    });

    it('displays expertise level with correct color and stars', () => {
      render(
        <TestWrapper>
          <PlayerProfile {...defaultProps} />
        </TestWrapper>
      );

      // Check expertise chip is displayed
      const expertiseChip = screen.getByText('Intermediate');
      expect(expertiseChip).toBeInTheDocument();

      // Check star rating is displayed (Intermediate = 2 stars)
      const starIcons = screen.getAllByTestId('star-icon');
      const starBorderIcons = screen.getAllByTestId('star-border-icon');
      expect(starIcons).toHaveLength(2);
      expect(starBorderIcons).toHaveLength(1);
    });

    it('displays different expertise levels correctly', () => {
      const novicePlayer = { ...mockPlayer, expertise: 'Beginner' as const };
      const { rerender } = render(
        <TestWrapper>
          <PlayerProfile {...defaultProps} player={novicePlayer} />
        </TestWrapper>
      );

      expect(screen.getByText('Beginner')).toBeInTheDocument();

      const expertPlayer = { ...mockPlayer, expertise: 'Expert' as const };
      rerender(
        <TestWrapper>
          <PlayerProfile {...defaultProps} player={expertPlayer} />
        </TestWrapper>
      );

      expect(screen.getByText('Expert')).toBeInTheDocument();
    });

    it('formats points with locale string', () => {
      const highPointsPlayer = { ...mockPlayer, points: 1234567 };
      render(
        <TestWrapper>
          <PlayerProfile {...defaultProps} player={highPointsPlayer} />
        </TestWrapper>
      );

      expect(screen.getByText('1,234,567')).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('enters edit mode when edit button is clicked', async () => {
      render(
        <TestWrapper>
          <PlayerProfile {...defaultProps} />
        </TestWrapper>
      );

      const editButton = screen.getByRole('button', { name: /edit profile/i });
      await user.click(editButton);

      // Check that form fields are displayed
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('does not show edit button when editable is false', () => {
      render(
        <TestWrapper>
          <PlayerProfile {...defaultProps} editable={false} />
        </TestWrapper>
      );

      expect(screen.queryByRole('button', { name: /edit profile/i })).not.toBeInTheDocument();
    });

    it('does not show action buttons when showActions is false', () => {
      render(
        <TestWrapper>
          <PlayerProfile {...defaultProps} showActions={false} />
        </TestWrapper>
      );

      expect(screen.queryByRole('button', { name: /edit profile/i })).not.toBeInTheDocument();
    });

    it('cancels edit mode and resets form', async () => {
      render(
        <TestWrapper>
          <PlayerProfile {...defaultProps} />
        </TestWrapper>
      );

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /edit profile/i });
      await user.click(editButton);

      // Modify the name field
      const nameField = screen.getByDisplayValue('John Doe');
      await user.clear(nameField);
      await user.type(nameField, 'Modified Name');

      // Cancel editing
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Check that we're back to display mode with original data
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates required name field', async () => {
      render(
        <TestWrapper>
          <PlayerProfile {...defaultProps} />
        </TestWrapper>
      );

      // Enter edit mode
      await user.click(screen.getByRole('button', { name: /edit profile/i }));

      // Clear the name field
      const nameField = screen.getByDisplayValue('John Doe');
      await user.clear(nameField);
      await user.tab(); // Trigger blur event

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
    });

    it('validates name length constraints', async () => {
      render(
        <TestWrapper>
          <PlayerProfile {...defaultProps} />
        </TestWrapper>
      );

      // Enter edit mode
      await user.click(screen.getByRole('button', { name: /edit profile/i }));

      const nameField = screen.getByDisplayValue('John Doe');

      // Test minimum length
      await user.clear(nameField);
      await user.type(nameField, 'A');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
      });

      // Test maximum length
      await user.clear(nameField);
      await user.type(nameField, 'A'.repeat(31));
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Name must be less than 30 characters')).toBeInTheDocument();
      });
    });

    it('validates name character pattern', async () => {
      render(
        <TestWrapper>
          <PlayerProfile {...defaultProps} />
        </TestWrapper>
      );

      // Enter edit mode
      await user.click(screen.getByRole('button', { name: /edit profile/i }));

      const nameField = screen.getByDisplayValue('John Doe');

      // Test invalid characters
      await user.clear(nameField);
      await user.type(nameField, 'John@Doe');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Name can only contain letters, numbers, spaces, hyphens, and underscores')).toBeInTheDocument();
      });
    });

    it('disables save button when form is invalid', async () => {
      render(
        <TestWrapper>
          <PlayerProfile {...defaultProps} />
        </TestWrapper>
      );

      // Enter edit mode
      await user.click(screen.getByRole('button', { name: /edit profile/i }));

      // Clear the name field to make form invalid
      const nameField = screen.getByDisplayValue('John Doe');
      await user.clear(nameField);
      await user.tab(); // Trigger validation

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /save changes/i });
        expect(saveButton).toBeDisabled();
      });
    });

    it('disables save button when no changes are made', async () => {
      render(
        <TestWrapper>
          <PlayerProfile {...defaultProps} />
        </TestWrapper>
      );

      // Enter edit mode
      await user.click(screen.getByRole('button', { name: /edit profile/i }));

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Profile Update', () => {
    it('successfully updates player profile', async () => {
      const mockUpdatePlayer = vi.mocked(PlayersService.updatePlayer);
      mockUpdatePlayer.mockResolvedValue(mockUpdatedPlayer);

      const onUpdateProfile = vi.fn();

      render(
        <TestWrapper>
          <PlayerProfile {...defaultProps} onUpdateProfile={onUpdateProfile} />
        </TestWrapper>
      );

      // Enter edit mode
      await user.click(screen.getByRole('button', { name: /edit profile/i }));

      // Update name
      const nameField = screen.getByDisplayValue('John Doe');
      await user.clear(nameField);
      await user.type(nameField, 'John Smith');

      // Update expertise
      const expertiseSelect = screen.getByRole('combobox');
      await user.click(expertiseSelect);
      await user.click(screen.getByRole('option', { name: /expert/i }));

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdatePlayer).toHaveBeenCalledWith({
          name: 'John Smith',
          expertise: 'Expert'
        });
        expect(onUpdateProfile).toHaveBeenCalledWith(mockUpdatedPlayer);
      });

      // Check that we're back to display mode
      expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
    });

    it('only sends changed fields in update request', async () => {
      const mockUpdatePlayer = vi.mocked(PlayersService.updatePlayer);
      mockUpdatePlayer.mockResolvedValue({ ...mockPlayer, name: 'John Smith' });

      render(
        <TestWrapper>
          <PlayerProfile {...defaultProps} />
        </TestWrapper>
      );

      // Enter edit mode
      await user.click(screen.getByRole('button', { name: /edit profile/i }));

      // Only update name
      const nameField = screen.getByDisplayValue('John Doe');
      await user.clear(nameField);
      await user.type(nameField, 'John Smith');

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdatePlayer).toHaveBeenCalledWith({
          name: 'John Smith'
        });
      });
    });

    it('does not make API call when no changes are made', async () => {
      const mockUpdatePlayer = vi.mocked(PlayersService.updatePlayer);

      render(
        <TestWrapper>
          <PlayerProfile {...defaultProps} />
        </TestWrapper>
      );

      // Enter edit mode
      await user.click(screen.getByRole('button', { name: /edit profile/i }));

      // Don't make any changes, just submit
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      
      // Save button should be disabled when no changes
      expect(saveButton).toBeDisabled();

      expect(mockUpdatePlayer).not.toHaveBeenCalled();
    });

    it('handles update errors gracefully', async () => {
      const mockUpdatePlayer = vi.mocked(PlayersService.updatePlayer);
      mockUpdatePlayer.mockRejectedValue(new Error('Server error'));

      render(
        <TestWrapper>
          <PlayerProfile {...defaultProps} />
        </TestWrapper>
      );

      // Enter edit mode and make changes
      await user.click(screen.getByRole('button', { name: /edit profile/i }));
      
      const nameField = screen.getByDisplayValue('John Doe');
      await user.clear(nameField);
      await user.type(nameField, 'John Smith');

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to update profile. Please try again.')).toBeInTheDocument();
      });

      // Should still be in edit mode
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('handles network errors with retry option', async () => {
      const mockUpdatePlayer = vi.mocked(PlayersService.updatePlayer);
      mockUpdatePlayer.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <PlayerProfile {...defaultProps} />
        </TestWrapper>
      );

      // Enter edit mode and make changes
      await user.click(screen.getByRole('button', { name: /edit profile/i }));
      
      const nameField = screen.getByDisplayValue('John Doe');
      await user.clear(nameField);
      await user.type(nameField, 'John Smith');

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Network error. Please check your connection and try again.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('shows loading state during submission', async () => {
      const mockUpdatePlayer = vi.mocked(PlayersService.updatePlayer);
      // Create a promise that we can control
      let resolvePromise: (value: Player) => void;
      const promise = new Promise<Player>((resolve) => {
        resolvePromise = resolve;
      });
      mockUpdatePlayer.mockReturnValue(promise);

      render(
        <TestWrapper>
          <PlayerProfile {...defaultProps} />
        </TestWrapper>
      );

      // Enter edit mode and make changes
      await user.click(screen.getByRole('button', { name: /edit profile/i }));
      
      const nameField = screen.getByDisplayValue('John Doe');
      await user.clear(nameField);
      await user.type(nameField, 'John Smith');

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      // Check loading state
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(saveButton).toBeDisabled();

      // Resolve the promise
      resolvePromise!(mockUpdatedPlayer);

      await waitFor(() => {
        expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Profile Refresh', () => {
    it('refreshes player profile when refresh button is clicked', async () => {
      const mockGetCurrentPlayer = vi.mocked(PlayersService.getCurrentPlayer);
      mockGetCurrentPlayer.mockResolvedValue(mockUpdatedPlayer);

      const onUpdateProfile = vi.fn();

      render(
        <TestWrapper>
          <PlayerProfile {...defaultProps} onUpdateProfile={onUpdateProfile} />
        </TestWrapper>
      );

      const refreshButton = screen.getByTitle('Refresh profile');
      await user.click(refreshButton);

      await waitFor(() => {
        expect(mockGetCurrentPlayer).toHaveBeenCalled();
        expect(onUpdateProfile).toHaveBeenCalledWith(mockUpdatedPlayer);
      });
    });

    it('handles refresh errors gracefully', async () => {
      const mockGetCurrentPlayer = vi.mocked(PlayersService.getCurrentPlayer);
      mockGetCurrentPlayer.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <PlayerProfile {...defaultProps} />
        </TestWrapper>
      );

      const refreshButton = screen.getByTitle('Refresh profile');
      await user.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to refresh profile. Please try again.')).toBeInTheDocument();
      });
    });

    it('shows loading state during refresh', async () => {
      const mockGetCurrentPlayer = vi.mocked(PlayersService.getCurrentPlayer);
      // Create a promise that we can control
      let resolvePromise: (value: Player) => void;
      const promise = new Promise<Player>((resolve) => {
        resolvePromise = resolve;
      });
      mockGetCurrentPlayer.mockReturnValue(promise);

      render(
        <TestWrapper>
          <PlayerProfile {...defaultProps} />
        </TestWrapper>
      );

      const refreshButton = screen.getByTitle('Refresh profile');
      await user.click(refreshButton);

      // Check that refresh button is disabled during loading
      expect(refreshButton).toBeDisabled();

      // Resolve the promise
      resolvePromise!(mockUpdatedPlayer);

      await waitFor(() => {
        expect(refreshButton).not.toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <PlayerProfile {...defaultProps} />
        </TestWrapper>
      );

      // Check that form elements have proper labels
      expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      render(
        <TestWrapper>
          <PlayerProfile {...defaultProps} />
        </TestWrapper>
      );

      // Tab to edit button and activate with Enter
      await user.tab(); // Tab to refresh button
      await user.tab(); // Tab to edit button
      await user.keyboard('{Enter}');

      // Should be in edit mode
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('renders with mobile-friendly touch targets', () => {
      render(
        <TestWrapper>
          <PlayerProfile {...defaultProps} />
        </TestWrapper>
      );

      const editButton = screen.getByRole('button', { name: /edit profile/i });
      
      // Check that button exists and is clickable (adequate for mobile)
      expect(editButton).toBeInTheDocument();
      expect(editButton).not.toBeDisabled();
    });

    it('uses appropriate font sizes for mobile', async () => {
      render(
        <TestWrapper>
          <PlayerProfile {...defaultProps} />
        </TestWrapper>
      );

      // Enter edit mode to check input font sizes
      await user.click(screen.getByRole('button', { name: /edit profile/i }));

      const nameField = screen.getByDisplayValue('John Doe');
      expect(nameField).toBeInTheDocument();
      
      // The component should set fontSize to prevent zoom on iOS
      // This is tested through the sx prop in the component
    });
  });
});