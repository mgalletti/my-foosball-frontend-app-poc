/**
 * @fileoverview ChallengesList component for displaying and managing foosball challenges
 * 
 * This component provides a comprehensive interface for viewing open challenges,
 * joining challenges, and creating new challenges. It displays challenges in
 * mobile-optimized cards with all relevant information and actions.
 * 
 * @version 1.0.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Avatar,
  AvatarGroup,
  Stack,
  Fab,
  Alert,
  CircularProgress,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  PersonAdd as JoinIcon,
  Event as EventIcon,
  Schedule as TimeIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  EmojiEvents as TrophyIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import type {
  Challenge,
  Player,
  ErrorState
} from '../types';
import { ChallengesService } from '../services';
import { usePlayer, useAppState } from '../context/AppContext';

/**
 * Props interface for individual challenge card component
 */
interface ChallengeCardProps {
  challenge: Challenge;
  currentPlayer: Player | null;
  onJoinChallenge: (challengeId: string) => Promise<void>;
  isJoining: boolean;
}

export interface ChallengesListProps {
  challenges: Challenge[];
  onJoinChallenge: (challengeId: string) => void;
  onCreateChallenge: () => void;
}

/**
 * Individual challenge card component
 * 
 * Displays a single challenge with all relevant information in a mobile-optimized
 * card format. Includes join functionality for eligible players.
 */
const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  currentPlayer,
  onJoinChallenge,
  isJoining
}) => {
  // Check if current player is already in this challenge
  const isPlayerInChallenge = useMemo(() => {
    if (!currentPlayer) return false;
    return challenge.players.some(player => player.id === currentPlayer.id) ||
      challenge.owner.id === currentPlayer.id;
  }, [challenge.players, challenge.owner.id, currentPlayer]);

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get time slot display with icon
  const getTimeSlotDisplay = (timeSlot: string) => {
    const timeMap = {
      'MORNING': '8:00 AM - 12:00 PM',
      'AFTERNOON': '12:00 PM - 6:00 PM',
      'EVENING': '6:00 PM - 10:00 PM',
      'NIGHT': '10:00 PM - 02:00 AM',
    };
    return timeMap[timeSlot as keyof typeof timeMap] || timeSlot;
  };

  // Get user-friendly time slot name
  const getTimeSlotName = (timeSlot: string) => {
    const nameMap = {
      'MORNING': 'Morning',
      'AFTERNOON': 'Afternoon',
      'EVENING': 'Evening',
      'NIGHT': 'Night',
    };
    return nameMap[timeSlot as keyof typeof nameMap] || timeSlot;
  };

  // Get expertise color
  const getExpertiseColor = (expertise: string) => {
    switch (expertise) {
      case 'BEGINNER':
      case 'Beginner': return 'success';
      case 'INTERMEDIATE':
      case 'Intermediate': return 'warning';
      case 'EXPERT':
      case 'Expert': return 'error';
      default: return 'default';
    }
  };
  const statusColor = 
    challenge.status.toLowerCase() === 'open' ? 'info' :
    challenge.status.toLowerCase() === 'active' ? 'success' :
    'warning';
  return (
    <Card
      sx={{
        mb: 2,
        borderRadius: 2,
        boxShadow: 2,
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-1px)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        {/* Challenge Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box flex={1}>
            <Typography variant="h6" component="h3" gutterBottom>
              {challenge.name} 
            </Typography>
            <Chip
              icon={<TrophyIcon />}
              label={challenge.status}
              color={statusColor}
              size="small"
              variant="outlined"
            />
          </Box>
        </Box>

        {/* Location Information */}
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <LocationIcon color="action" fontSize="small" />
          <Typography variant="body2" color="text.secondary">
            {challenge.place.name}
          </Typography>
        </Box>

        {/* Date and Time */}
        <Stack direction="row" spacing={2} mb={2}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <EventIcon color="action" fontSize="small" />
            <Typography variant="body2">
              {formatDate(challenge.date)}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <TimeIcon color="action" fontSize="small" />
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {getTimeSlotName(challenge.time)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getTimeSlotDisplay(challenge.time)}
              </Typography>
            </Box>
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Owner Information */}
        <Box mb={2}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Challenge Owner
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ width: 32, height: 32 }}>
              {challenge.owner.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {challenge.owner.name}
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  label={challenge.owner.expertise}
                  size="small"
                  color={getExpertiseColor(challenge.owner.expertise) as any}
                  variant="outlined"
                />
                <Typography variant="caption" color="text.secondary">
                  {challenge.owner.points} pts
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Players Information */}
        <Box>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Players ({challenge.players.length})
            </Typography>
            <Chip
              icon={<GroupIcon />}
              label={`${challenge.players.length} joined`}
              size="small"
              variant="outlined"
            />
          </Box>

          {challenge.players.length > 0 ? (
            <Box>
              <AvatarGroup max={4} sx={{ mb: 1, justifyContent: 'flex-start' }}>
                {challenge.players.map((player) => (
                  <Tooltip key={player.id} title={`${player.name} (${player.expertise})`}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {player.name.charAt(0).toUpperCase()}
                    </Avatar>
                  </Tooltip>
                ))}
              </AvatarGroup>

              {/* Show first few player names */}
              <Typography variant="caption" color="text.secondary">
                {challenge.players.slice(0, 3).map(p => p.name).join(', ')}
                {challenge.players.length > 3 && ` +${challenge.players.length - 3} more`}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              No players joined yet
            </Typography>
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2 }}>
        {currentPlayer && !isPlayerInChallenge ? (
          <Button
            variant="contained"
            startIcon={isJoining ? <CircularProgress size={16} /> : <JoinIcon />}
            onClick={() => onJoinChallenge(challenge.id)}
            disabled={isJoining}
            fullWidth
            sx={{ borderRadius: 2 }}
          >
            {isJoining ? 'Joining...' : 'Join Challenge'}
          </Button>
        ) : isPlayerInChallenge ? (
          <Button
            variant="outlined"
            startIcon={<PersonIcon />}
            disabled
            fullWidth
            sx={{ borderRadius: 2 }}
          >
            Already Joined
          </Button>
        ) : (
          <Button
            variant="outlined"
            disabled
            fullWidth
            sx={{ borderRadius: 2 }}
          >
            Login to Join
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

/**
 * ChallengesList component for displaying and managing challenges
 * 
 * Displays a list of open challenges with filtering, join functionality,
 * and challenge creation capabilities. Optimized for mobile interaction.
 */
const ChallengesList: React.FC<ChallengesListProps> = ({
  challenges,
  onJoinChallenge,
  onCreateChallenge
}) => {
  const { currentPlayer } = usePlayer();
  const { setError } = useAppState();

  // Local state for join operations
  const [joiningChallenges, setJoiningChallenges] = useState<Set<string>>(new Set());
  const [joinError, setJoinError] = useState<ErrorState | null>(null);

  // Filter challenges to show only open ones
  const openChallenges = useMemo(() => {
    return challenges.filter(challenge => challenge.status.toLocaleLowerCase() === 'open');
  }, [challenges]);

  /**
   * Handle joining a challenge with error handling
   */
  const handleJoinChallenge = useCallback(async (challengeId: string) => {
    if (!currentPlayer) {
      setError({
        type: 'validation',
        message: 'You must be logged in to join challenges',
        retryable: false
      });
      return;
    }

    // Check if already joining this challenge
    if (joiningChallenges.has(challengeId)) {
      return;
    }

    setJoiningChallenges(prev => new Set(prev).add(challengeId));
    setJoinError(null);

    try {
      await ChallengesService.joinChallenge(challengeId, currentPlayer.id);
      onJoinChallenge(challengeId);
    } catch (error) {
      console.error('Failed to join challenge:', error);

      if (error instanceof Error) {
        if (error.message.includes('already joined')) {
          setJoinError({
            type: 'validation',
            message: 'You have already joined this challenge',
            retryable: false
          });
        } else if (error.message.includes('Network error')) {
          setJoinError({
            type: 'network',
            message: 'Network error. Please check your connection and try again.',
            retryable: true
          });
        } else {
          setJoinError({
            type: 'server',
            message: 'Failed to join challenge. Please try again.',
            retryable: true
          });
        }
      } else {
        setJoinError({
          type: 'unknown',
          message: 'An unexpected error occurred. Please try again.',
          retryable: true
        });
      }
    } finally {
      setJoiningChallenges(prev => {
        const newSet = new Set(prev);
        newSet.delete(challengeId);
        return newSet;
      });
    }
  }, [currentPlayer, joiningChallenges, onJoinChallenge, setError]);

  // Show empty state if no open challenges
  if (openChallenges.length === 0) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="60vh"
        textAlign="center"
        px={3}
      >
        <TrophyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          No Open Challenges
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Be the first to create a challenge and invite other players to compete!
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreateChallenge}
          size="large"
          sx={{ borderRadius: 2 }}
        >
          Create Challenge
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', pb: 10 }}>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h5" gutterBottom>
          {challenges.length} Challenges
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {openChallenges.length} challenge{openChallenges.length !== 1 ? 's' : ''} available to join
        </Typography>
      </Box>

      {/* Join Error Display */}
      {joinError && (
        <Alert
          severity="error"
          onClose={() => setJoinError(null)}
          sx={{ mb: 2 }}
        >
          {joinError.message}
        </Alert>
      )}

      {/* Challenges List */}
      <Box>
        {challenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            currentPlayer={currentPlayer}
            onJoinChallenge={handleJoinChallenge}
            isJoining={joiningChallenges.has(challenge.id)}
          />
        ))}
      </Box>

      {/* Floating Action Button for Creating Challenges */}
      <Fab
        color="primary"
        aria-label="create challenge"
        onClick={onCreateChallenge}
        sx={{
          position: 'fixed',
          bottom: 80, // Above bottom navigation
          right: 16,
          zIndex: 1000
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default ChallengesList;