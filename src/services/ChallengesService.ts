import type { Challenge, CreateChallengeRequest, JoinChallengeRequest, Player, Place } from '../types';
import { BaseApiService } from './api';

// TODO: Re-enable lint violation when logging in catches is properly implemented
/* eslint-disable no-useless-catch */

// Type guards for response validation
const isPlayer = (data: any): data is Player => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    ['Novice', 'Intermediate', 'Expert'].includes(data.expertise) &&
    typeof data.points === 'number'
  );
};

const isPlace = (data: any): data is Place => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    typeof data.coordinates === 'object' &&
    typeof data.coordinates.lat === 'number' &&
    typeof data.coordinates.long === 'number' &&
    typeof data.status === 'string'
  );
};

const isChallenge = (data: any): data is Challenge => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    isPlace(data.place) &&
    typeof data.date === 'string' &&
    ['MORNING', 'AFTERNOON', 'EVENING'].includes(data.time) &&
    ['Open', 'Closed', 'Completed'].includes(data.status) &&
    isPlayer(data.owner) &&
    Array.isArray(data.players) &&
    data.players.every(isPlayer)
  );
};

const isChallengeArray = (data: any): data is Challenge[] => {
  return Array.isArray(data) && data.every(isChallenge);
};

export class ChallengesService extends BaseApiService {
  /**
   * Fetch all challenges from the /challenges endpoint
   * @returns Promise<Challenge[]> Array of challenges
   * @throws ApiServiceError on network or server errors
   */
  static async getChallenges(): Promise<Challenge[]> {
    try {
      const data = await this.request<Challenge[]>('/challenges');
      return this.validateResponse(data, isChallengeArray);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new challenge
   * @param challenge - The challenge data to create
   * @returns Promise<Challenge> The created challenge
   * @throws ApiServiceError on validation, network, or server errors
   */
  static async createChallenge(challenge: CreateChallengeRequest): Promise<Challenge> {
    // Validate input
    if (!challenge.name || typeof challenge.name !== 'string') {
      throw new Error('Challenge name is required and must be a string');
    }
    if (!challenge.placeId || typeof challenge.placeId !== 'string') {
      throw new Error('Place ID is required and must be a string');
    }
    if (!challenge.date || typeof challenge.date !== 'string') {
      throw new Error('Date is required and must be a string');
    }
    if (!challenge.time || !['MORNING', 'AFTERNOON', 'EVENING'].includes(challenge.time)) {
      throw new Error('Time is required and must be MORNING, AFTERNOON, or EVENING');
    }

    try {
      const data = await this.request<Challenge>('/challenges', {
        method: 'POST',
        body: JSON.stringify(challenge),
      });
      return this.validateResponse(data, isChallenge);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Join an existing challenge
   * @param challengeId - The ID of the challenge to join
   * @param playerId - The ID of the player joining
   * @returns Promise<Challenge> The updated challenge
   * @throws ApiServiceError on validation, network, or server errors
   */
  static async joinChallenge(challengeId: string, playerId: string): Promise<Challenge> {
    if (!challengeId || typeof challengeId !== 'string') {
      throw new Error('Challenge ID is required and must be a string');
    }
    if (!playerId || typeof playerId !== 'string') {
      throw new Error('Player ID is required and must be a string');
    }

    const joinRequest: JoinChallengeRequest = {
      challengeId,
      playerId,
    };

    try {
      const data = await this.request<Challenge>(`/challenges/${encodeURIComponent(challengeId)}/join`, {
        method: 'POST',
        body: JSON.stringify(joinRequest),
      });
      return this.validateResponse(data, isChallenge);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get challenges for a specific place
   * @param placeId - The place ID to filter by
   * @returns Promise<Challenge[]> Array of challenges at the place
   */
  static async getChallengesByPlace(placeId: string): Promise<Challenge[]> {
    if (!placeId || typeof placeId !== 'string') {
      throw new Error('Place ID is required and must be a string');
    }

    try {
      const challenges = await this.getChallenges();
      return challenges.filter((challenge) => challenge.place.id === placeId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get open challenges only
   * @returns Promise<Challenge[]> Array of open challenges
   */
  static async getOpenChallenges(): Promise<Challenge[]> {
    try {
      const challenges = await this.getChallenges();
      return challenges.filter((challenge) => challenge.status === 'Open');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get challenges by status
   * @param status - The status to filter by
   * @returns Promise<Challenge[]> Array of challenges with the specified status
   */
  static async getChallengesByStatus(status: Challenge['status']): Promise<Challenge[]> {
    if (!status || !['Open', 'Closed', 'Completed'].includes(status)) {
      throw new Error('Status must be Open, Closed, or Completed');
    }

    try {
      const challenges = await this.getChallenges();
      return challenges.filter((challenge) => challenge.status === status);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a specific challenge by ID
   * @param id - The challenge ID to fetch
   * @returns Promise<Challenge> The challenge object
   */
  static async getChallengeById(id: string): Promise<Challenge> {
    if (!id || typeof id !== 'string') {
      throw new Error('Challenge ID is required and must be a string');
    }

    try {
      const data = await this.request<Challenge>(`/challenges/${encodeURIComponent(id)}`);
      return this.validateResponse(data, isChallenge);
    } catch (error) {
      throw error;
    }
  }
}
