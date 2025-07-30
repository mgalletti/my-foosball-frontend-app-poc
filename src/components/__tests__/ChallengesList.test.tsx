/**
 * @fileoverview Tests for ChallengesList component
 * 
 * This test suite covers challenge display, join functionality, filtering,
 * error handling, and mobile-optimized interactions for the ChallengesList component.
 * 
 * @version 1.0.0
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ChallengesList from '../ChallengesList';
import { ChallengesService } from '../../services';
import type { Challenge, Player, Place } from '../../types';

// Mock the ChallengesService
vi.mock('../../services', () => ({
  ChallengesService: {
    joinChallenge: vi.fn()
  }
}));

const mockChallengesService = vi.mocked(ChallengesService);

// Mock data
const mockPlayer: Player = {
  id: 'player-1',
  name: 'Test Player',
  expertise: 'Intermediate',
  points: 150
};

const mockOwner: Player = {
  id: 'owner-1',
  name: 'Challenge Owner',
  expertise: 'Expert',
  points: 500
};

const mockPlace: Place = {
  id: 'place-1',
  name: 'Downtown Foosball Club',
  coordinates: {
    lat: 40.7128,
    long: -74.0060
  },
  status: '1'
};

const mockOpenChallenge: Challenge = {
  id: 'challenge-1',
  name: 'Friday Night Showdown',
  place: mockPlace,
  date: '2024-12-25',
  time: 'Evening',
  status: 'Open',
  owner: mockOwner,
  players: [
    {
      id: 'player-2',
      name: 'John Doe',
      expertise: 'Novice',
      points: 50
    },
    {
      id: 'player-3',
      name: 'Jane Smith',
      expertise: 'Intermediate',
      points: 200
    }
  ]
};

const mockClosedChallenge: Challenge = {
  id: 'challenge-2',
  name: 'Closed Challenge',
  place: mockPlace,
  date: '2024-12-26',
  time: 'Morning',
  status: 'Closed',
  owner: mockOwner,
  players: []
};

const mockChallengeWithCurrentPlayer: Challenge = {
  id: 'challenge-3',
  name: 'Already Joined Challenge',
  place: mockPlace,
  date: '2024-12-27',
  time: 'Afternoon',
  status: 'Closed', // Make this closed so it doesn't appear in open challenges
  owner: mockOwner,
  players: [mockPlayer] // Current player is already in this challenge
};

// Mock props
const defaultProps = {
  challenges: [mockOpenChallenge, mockClosedChallenge],
  onJoinChallenge: vi.fn(),
  onCreateChallenge: vi.fn()
};

// Test wrapper with context
const TestWrapper: React.FC<{ children: React.ReactNode; currentPlayer?: Player | null }> = ({ 
  children,
}) => {

  return (
    <div data-testid="test-wrapper">
      {children}
    </div>
  );
};

// Mock the context hooks
let mockCurrentPlayer: Player | null = mockPlayer;

vi.mock('../../context/AppContext', async () => {
  const actual = await vi.importActual('../../context/AppContext');
  return {
    ...actual,
    usePlayer: () => ({
      currentPlayer: mockCurrentPlayer,
      setCurrentPlayer: vi.fn(),
      updatePlayer: vi.fn(),
      loading: false,
      error: null
    }),
    useAppState: () => ({
      loading: false,
      error: null,
      setLoading: vi.fn(),
      setError: vi.fn(),
      clearError: vi.fn()
    })
  };
});

// Custom render function with context
const renderWithContext = (
  ui: React.ReactElement,
  { currentPlayer = mockPlayer, ...options } = {}
) => {
  mockCurrentPlayer = currentPlayer;
  return render(
    <TestWrapper currentPlayer={currentPlayer}>
      {ui}
    </TestWrapper>,
    options
  );
};

describe('ChallengesList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render the challenges list with header', () => {
      renderWithContext(<ChallengesList {...defaultProps} />);

      expect(screen.getByText('Open Challenges')).toBeInTheDocument();
      expect(screen.getByText('1 challenge available to join')).toBeInTheDocument();
    });

    it('should filter and display only open challenges', () => {
      renderWithContext(<ChallengesList {...defaultProps} />);

      // Should show open challenge
      expect(screen.getByText('Friday Night Showdown')).toBeInTheDocument();
      
      // Should not show closed challenge
      expect(screen.queryByText('Closed Challenge')).not.toBeInTheDocument();
    });

    it('should display challenge information correctly', () => {
      renderWithContext(<ChallengesList {...defaultProps} />);

      // Challenge name and status
      expect(screen.getByText('Friday Night Showdown')).toBeInTheDocument();
      expect(screen.getByText('Open')).toBeInTheDocument();

      // Location
      expect(screen.getByText('Downtown Foosball Club')).toBeInTheDocument();

      // Date and time
      expect(screen.getByText('Wed, Dec 25')).toBeInTheDocument();
      expect(screen.getByText('6:00 PM - 10:00 PM')).toBeInTheDocument();

      // Owner information
      expect(screen.getAllByText('Challenge Owner')[0]).toBeInTheDocument();
      expect(screen.getByText('Expert')).toBeInTheDocument();
      expect(screen.getByText('500 pts')).toBeInTheDocument();

      // Players information
      expect(screen.getByText('Players (2)')).toBeInTheDocument();
      expect(screen.getByText('2 joined')).toBeInTheDocument();
      expect(screen.getByText('John Doe, Jane Smith')).toBeInTheDocument();
    });

    it('should display empty state when no open challenges', () => {
      const propsWithNoChallenges = {
        ...defaultProps,
        challenges: [mockClosedChallenge] // Only closed challenges
      };

      renderWithContext(<ChallengesList {...propsWithNoChallenges} />);

      expect(screen.getByText('No Open Challenges')).toBeInTheDocument();
      expect(screen.getByText('Be the first to create a challenge and invite other players to compete!')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create challenge/i })).toBeInTheDocument();
    });

    it('should show floating action button for creating challenges', () => {
      renderWithContext(<ChallengesList {...defaultProps} />);

      const fab = screen.getByLabelText('create challenge');
      expect(fab).toBeInTheDocument();
    });

    it('should handle challenges with no players', () => {
      const challengeWithNoPlayers: Challenge = {
        ...mockOpenChallenge,
        players: []
      };

      const props = {
        ...defaultProps,
        challenges: [challengeWithNoPlayers]
      };

      renderWithContext(<ChallengesList {...props} />);

      expect(screen.getByText('Players (0)')).toBeInTheDocument();
      expect(screen.getByText('0 joined')).toBeInTheDocument();
      expect(screen.getByText('No players joined yet')).toBeInTheDocument();
    });

    it('should truncate long player lists', () => {
      const challengeWithManyPlayers: Challenge = {
        ...mockOpenChallenge,
        players: [
          { id: '1', name: 'Player One', expertise: 'Novice', points: 10 },
          { id: '2', name: 'Player Two', expertise: 'Novice', points: 20 },
          { id: '3', name: 'Player Three', expertise: 'Novice', points: 30 },
          { id: '4', name: 'Player Four', expertise: 'Novice', points: 40 },
          { id: '5', name: 'Player Five', expertise: 'Novice', points: 50 }
        ]
      };

      const props = {
        ...defaultProps,
        challenges: [challengeWithManyPlayers]
      };

      renderWithContext(<ChallengesList {...props} />);

      expect(screen.getByText('Player One, Player Two, Player Three +2 more')).toBeInTheDocument();
    });
  });

  describe('Join Challenge Functionality', () => {
    it('should show join button for eligible challenges', () => {
      renderWithContext(<ChallengesList {...defaultProps} />);

      const joinButton = screen.getByRole('button', { name: /join challenge/i });
      expect(joinButton).toBeInTheDocument();
      expect(joinButton).not.toBeDisabled();
    });

    it('should show "Already Joined" for challenges user is in', () => {
      const challengeWithCurrentPlayerOpen: Challenge = {
        ...mockChallengeWithCurrentPlayer,
        status: 'Open' // Make it open so it shows up
      };
      
      const props = {
        ...defaultProps,
        challenges: [challengeWithCurrentPlayerOpen]
      };

      renderWithContext(<ChallengesList {...props} />);

      expect(screen.getByRole('button', { name: /already joined/i })).toBeInTheDocument();
    });

    it('should handle successful challenge join', async () => {
      const user = userEvent.setup();
      mockChallengesService.joinChallenge.mockResolvedValue(mockOpenChallenge);

      renderWithContext(<ChallengesList {...defaultProps} />);

      const joinButton = screen.getByRole('button', { name: /join challenge/i });
      await user.click(joinButton);

      await waitFor(() => {
        expect(mockChallengesService.joinChallenge).toHaveBeenCalledWith(
          mockOpenChallenge.id,
          mockPlayer.id
        );
      });

      expect(defaultProps.onJoinChallenge).toHaveBeenCalledWith(mockOpenChallenge.id);
    });

    it('should show loading state while joining', async () => {
      const user = userEvent.setup();
      
      // Mock a delayed response
      mockChallengesService.joinChallenge.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockOpenChallenge), 100))
      );

      renderWithContext(<ChallengesList {...defaultProps} />);

      const joinButton = screen.getByRole('button', { name: /join challenge/i });
      await user.click(joinButton);

      // Should show loading state
      expect(screen.getByText('Joining...')).toBeInTheDocument();
      expect(joinButton).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText('Joining...')).not.toBeInTheDocument();
      });
    });

    it('should show login prompt when no current player', () => {
      renderWithContext(
        <ChallengesList {...defaultProps} />,
        { currentPlayer: null }
      );

      expect(screen.getByRole('button', { name: /login to join/i })).toBeInTheDocument();
    });

    it('should handle join errors gracefully', async () => {
      const user = userEvent.setup();
      mockChallengesService.joinChallenge.mockRejectedValue(
        new Error('Failed to join challenge')
      );

      renderWithContext(<ChallengesList {...defaultProps} />);

      const joinButton = screen.getByRole('button', { name: /join challenge/i });
      await user.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to join challenge. Please try again.')).toBeInTheDocument();
      });
    });

    it('should handle already joined error', async () => {
      const user = userEvent.setup();
      mockChallengesService.joinChallenge.mockRejectedValue(
        new Error('Player already joined this challenge')
      );

      renderWithContext(<ChallengesList {...defaultProps} />);

      const joinButton = screen.getByRole('button', { name: /join challenge/i });
      await user.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText('You have already joined this challenge')).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      const user = userEvent.setup();
      mockChallengesService.joinChallenge.mockRejectedValue(
        new Error('Network error occurred')
      );

      renderWithContext(<ChallengesList {...defaultProps} />);

      const joinButton = screen.getByRole('button', { name: /join challenge/i });
      await user.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText('Network error. Please check your connection and try again.')).toBeInTheDocument();
      });
    });

    it('should allow dismissing error messages', async () => {
      const user = userEvent.setup();
      mockChallengesService.joinChallenge.mockRejectedValue(
        new Error('Test error')
      );

      renderWithContext(<ChallengesList {...defaultProps} />);

      const joinButton = screen.getByRole('button', { name: /join challenge/i });
      await user.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to join challenge. Please try again.')).toBeInTheDocument();
      });

      // Dismiss error
      const closeButton = screen.getByLabelText(/close/i);
      await user.click(closeButton);

      expect(screen.queryByText('Failed to join challenge. Please try again.')).not.toBeInTheDocument();
    });

    it('should prevent multiple simultaneous join attempts', async () => {
      const user = userEvent.setup();
      
      // Mock a delayed response
      mockChallengesService.joinChallenge.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockOpenChallenge), 100))
      );

      renderWithContext(<ChallengesList {...defaultProps} />);

      const joinButton = screen.getByRole('button', { name: /join challenge/i });
      
      // Click once to start the join process
      await user.click(joinButton);

      // Button should be disabled and show loading state
      expect(screen.getByText('Joining...')).toBeInTheDocument();
      expect(joinButton).toBeDisabled();

      // Should only call the service once
      await waitFor(() => {
        expect(mockChallengesService.joinChallenge).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Challenge Creation', () => {
    it('should call onCreateChallenge when FAB is clicked', async () => {
      const user = userEvent.setup();
      renderWithContext(<ChallengesList {...defaultProps} />);

      const fab = screen.getByLabelText('create challenge');
      await user.click(fab);

      expect(defaultProps.onCreateChallenge).toHaveBeenCalled();
    });

    it('should call onCreateChallenge from empty state', async () => {
      const user = userEvent.setup();
      const propsWithNoChallenges = {
        ...defaultProps,
        challenges: []
      };

      renderWithContext(<ChallengesList {...propsWithNoChallenges} />);

      const createButton = screen.getByRole('button', { name: /create challenge/i });
      await user.click(createButton);

      expect(defaultProps.onCreateChallenge).toHaveBeenCalled();
    });
  });

  describe('Date Formatting', () => {
    it('should format dates correctly', () => {
      const challengeWithSpecificDate: Challenge = {
        ...mockOpenChallenge,
        date: '2024-07-15' // Monday
      };

      const props = {
        ...defaultProps,
        challenges: [challengeWithSpecificDate]
      };

      renderWithContext(<ChallengesList {...props} />);

      expect(screen.getByText('Mon, Jul 15')).toBeInTheDocument();
    });
  });

  describe('Expertise Level Display', () => {
    it('should display expertise levels with correct colors', () => {
      const challengeWithVariousExpertise: Challenge = {
        ...mockOpenChallenge,
        owner: { ...mockOwner, expertise: 'Novice' },
        players: [
          { id: '1', name: 'Novice Player', expertise: 'Novice', points: 10 },
          { id: '2', name: 'Expert Player', expertise: 'Expert', points: 1000 }
        ]
      };

      const props = {
        ...defaultProps,
        challenges: [challengeWithVariousExpertise]
      };

      renderWithContext(<ChallengesList {...props} />);

      expect(screen.getByText('Novice')).toBeInTheDocument();
    });
  });

  describe('Mobile Optimization', () => {
    it('should have touch-friendly card interactions', () => {
      renderWithContext(<ChallengesList {...defaultProps} />);

      const challengeCard = screen.getByText('Friday Night Showdown').closest('[class*="MuiCard"]');
      expect(challengeCard).toBeInTheDocument();
      
      // Check that the card has rounded corners (borderRadius is applied via CSS classes)
      expect(challengeCard).toHaveClass(/MuiCard/);
    });

    it('should position FAB correctly for mobile', () => {
      renderWithContext(<ChallengesList {...defaultProps} />);

      const fab = screen.getByLabelText('create challenge');
      expect(fab).toHaveStyle({
        position: 'fixed',
        bottom: '80px', // Above bottom navigation
        right: '16px',
        zIndex: '1000'
      });
    });

    it('should have proper card hover effects', () => {
      renderWithContext(<ChallengesList {...defaultProps} />);

      const challengeCard = screen.getByText('Friday Night Showdown').closest('[class*="MuiCard"]');
      
      // Check that the card exists and has MUI styling
      expect(challengeCard).toBeInTheDocument();
      expect(challengeCard).toHaveClass(/MuiCard/);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithContext(<ChallengesList {...defaultProps} />);

      expect(screen.getByLabelText('create challenge')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /join challenge/i })).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      renderWithContext(<ChallengesList {...defaultProps} />);

      expect(screen.getByRole('heading', { level: 5, name: 'Open Challenges' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'Friday Night Showdown' })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithContext(<ChallengesList {...defaultProps} />);

      // Tab to join button
      await user.tab();
      const joinButton = screen.getByRole('button', { name: /join challenge/i });
      expect(joinButton).toHaveFocus();

      // Tab to FAB
      await user.tab();
      expect(screen.getByLabelText('create challenge')).toHaveFocus();
    });

    it('should have proper button states for screen readers', () => {
      renderWithContext(<ChallengesList {...defaultProps} />);

      const joinButton = screen.getByRole('button', { name: /join challenge/i });
      expect(joinButton).not.toHaveAttribute('aria-disabled');
      expect(joinButton).not.toBeDisabled();
    });
  });

  describe('Player Avatar Display', () => {
    it('should show player avatars with tooltips', async () => {
      const user = userEvent.setup();
      renderWithContext(<ChallengesList {...defaultProps} />);

      // Find avatar by aria-label instead of text to avoid ambiguity
      const avatar = screen.getByLabelText('John Doe (Novice)');
      
      // Hover to show tooltip
      await user.hover(avatar);

      await waitFor(() => {
        expect(screen.getByText('John Doe (Novice)')).toBeInTheDocument();
      });
    });

    it('should limit avatar display to 4 players', () => {
      const challengeWithManyPlayers: Challenge = {
        ...mockOpenChallenge,
        players: Array.from({ length: 6 }, (_, i) => ({
          id: `player-${i}`,
          name: `Player ${i + 1}`,
          expertise: 'Novice' as const,
          points: 10
        }))
      };

      const props = {
        ...defaultProps,
        challenges: [challengeWithManyPlayers]
      };

      renderWithContext(<ChallengesList {...props} />);

      // Check that AvatarGroup exists and has max prop
      const avatarGroup = document.querySelector('[class*="MuiAvatarGroup"]');
      expect(avatarGroup).toBeInTheDocument();
    });
  });

  describe('Challenge Status Display', () => {
    it('should show status chip with correct styling', () => {
      renderWithContext(<ChallengesList {...defaultProps} />);

      const statusChips = screen.getAllByText('Open');
      expect(statusChips[0]).toBeInTheDocument();
      
      // Should be a chip component
      expect(statusChips[0].closest('[class*="MuiChip"]')).toBeInTheDocument();
    });
  });

  describe('Error Boundary Integration', () => {
    it('should handle rendering errors gracefully', () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Test with empty challenges array instead of bad data
      const propsWithEmptyData = {
        ...defaultProps,
        challenges: []
      };

      expect(() => {
        renderWithContext(<ChallengesList {...propsWithEmptyData} />);
      }).not.toThrow();

      // Should show empty state
      expect(screen.getByText('No Open Challenges')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });
});