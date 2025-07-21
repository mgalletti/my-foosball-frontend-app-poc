import type { Player, UpdatePlayerRequest } from '../types';
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

export class PlayersService extends BaseApiService {
  /**
   * Get the current player's profile
   * @returns Promise<Player> The current player's data
   * @throws ApiServiceError on network or server errors
   */
  static async getCurrentPlayer(): Promise<Player> {
    try {
      const data = await this.request<Player>('/players/me');
      return this.validateResponse(data, isPlayer);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update the current player's profile
   * @param updates - Partial player data to update
   * @returns Promise<Player> The updated player data
   * @throws ApiServiceError on validation, network, or server errors
   */
  static async updatePlayer(updates: UpdatePlayerRequest): Promise<Player> {
    // Validate input
    if (updates.name !== undefined && (typeof updates.name !== 'string' || updates.name.trim().length === 0)) {
      throw new Error('Name must be a non-empty string');
    }
    if (updates.expertise !== undefined && !['Novice', 'Intermediate', 'Expert'].includes(updates.expertise)) {
      throw new Error('Expertise must be Novice, Intermediate, or Expert');
    }
    if (updates.points !== undefined && (typeof updates.points !== 'number' || updates.points < 0)) {
      throw new Error('Points must be a non-negative number');
    }

    try {
      const data = await this.request<Player>('/players/me', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return this.validateResponse(data, isPlayer);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a player by ID
   * @param id - The player ID to fetch
   * @returns Promise<Player> The player data
   * @throws ApiServiceError on network, server, or not found errors
   */
  static async getPlayerById(id: string): Promise<Player> {
    if (!id || typeof id !== 'string') {
      throw new Error('Player ID is required and must be a string');
    }

    try {
      const data = await this.request<Player>(`/players/${encodeURIComponent(id)}`);
      return this.validateResponse(data, isPlayer);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get players by expertise level
   * @param expertise - The expertise level to filter by
   * @returns Promise<Player[]> Array of players with the specified expertise
   */
  static async getPlayersByExpertise(expertise: Player['expertise']): Promise<Player[]> {
    if (!expertise || !['Novice', 'Intermediate', 'Expert'].includes(expertise)) {
      throw new Error('Expertise must be Novice, Intermediate, or Expert');
    }

    try {
      const data = await this.request<Player[]>(`/players?expertise=${encodeURIComponent(expertise)}`);
      if (!Array.isArray(data) || !data.every(isPlayer)) {
        throw new Error('Invalid response format from server');
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get top players by points
   * @param limit - Maximum number of players to return (default: 10)
   * @returns Promise<Player[]> Array of top players sorted by points
   */
  static async getTopPlayers(limit: number = 10): Promise<Player[]> {
    if (typeof limit !== 'number' || limit < 1) {
      throw new Error('Limit must be a positive number');
    }

    try {
      const data = await this.request<Player[]>(`/players/top?limit=${limit}`);
      if (!Array.isArray(data) || !data.every(isPlayer)) {
        throw new Error('Invalid response format from server');
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update player points (typically called after completing challenges)
   * @param playerId - The player ID to update
   * @param pointsToAdd - Points to add to the player's total
   * @returns Promise<Player> The updated player data
   */
  static async updatePlayerPoints(playerId: string, pointsToAdd: number): Promise<Player> {
    if (!playerId || typeof playerId !== 'string') {
      throw new Error('Player ID is required and must be a string');
    }
    if (typeof pointsToAdd !== 'number') {
      throw new Error('Points to add must be a number');
    }

    try {
      const data = await this.request<Player>(`/players/${encodeURIComponent(playerId)}/points`, {
        method: 'POST',
        body: JSON.stringify({ points: pointsToAdd }),
      });
      return this.validateResponse(data, isPlayer);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update player expertise level
   * @param playerId - The player ID to update
   * @param expertise - The new expertise level
   * @returns Promise<Player> The updated player data
   */
  static async updatePlayerExpertise(playerId: string, expertise: Player['expertise']): Promise<Player> {
    if (!playerId || typeof playerId !== 'string') {
      throw new Error('Player ID is required and must be a string');
    }
    if (!expertise || !['Novice', 'Intermediate', 'Expert'].includes(expertise)) {
      throw new Error('Expertise must be Novice, Intermediate, or Expert');
    }

    try {
      const data = await this.request<Player>(`/players/${encodeURIComponent(playerId)}/expertise`, {
        method: 'POST',
        body: JSON.stringify({ expertise }),
      });
      return this.validateResponse(data, isPlayer);
    } catch (error) {
      throw error;
    }
  }
}
